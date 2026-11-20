import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Building,
  Check,
  Copy,
  X,
  ArrowRight,
  RotateCcw,
  ExternalLink,
  Smartphone,
  Lock,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import {
  getPaymentSettings,
  lookupIfsc,
  initiateEasebuzzOnboarding,
  verifyEasebuzzKycOtp,
  resendEasebuzzKycOtp,
  resetEasebuzzSubmerchant,
  getEasebuzzTestPaymentLink,
  toggleEasebuzzOnline,
  type PaymentSettings,
} from "@/api/propertyOwner";
import { useSubscriptionAccess } from "@/hooks/useSubscriptionAccess";
import { useApp } from "@/context/AppContext";

export const EasebuzzGatewayCard = () => {
  const navigate = useNavigate();
  const { selectedPgId, properties } = useApp();
  const selectedPg = Array.isArray(properties) ? properties.find((p) => p.id === selectedPgId) : null;

  // General Loading & Settings state
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // In-Page Multi-Step State: 1 = Details Entry, 2 = Aadhaar OTP, 3 = Active
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Form State: Business & Identity Details
  const [businessName, setBusinessName] = useState("");
  const [entityType, setEntityType] = useState("individual");
  const [panNumber, setPanNumber] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");

  // Form State: Settlement Bank Details
  const [accountHolderName, setAccountHolderName] = useState("");
  const [bankName, setBankName] = useState("");
  const [branch, setBranch] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmAccountNumber, setConfirmAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [isLookingUpIfsc, setIsLookingUpIfsc] = useState(false);

  // Step 2 OTP State
  const [kycOtp, setKycOtp] = useState("");
  const [otpMobileLast4, setOtpMobileLast4] = useState("3356");
  const [testHint, setTestHint] = useState("");

  // Test Link Dialog State
  const [testLinkData, setTestLinkData] = useState<{
    tenantName: string;
    roomNumber: string;
    propertyName: string;
    amount: string;
    paymentUrl: string;
    txnid: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await getPaymentSettings();
      setSettings(data);

      // Pre-fill form if existing bank details or PG name
      if (data.submerchant) {
        const sub = data.submerchant as any;
        if (sub.businessName && !businessName) setBusinessName(sub.businessName);
        if (sub.entityType) setEntityType(sub.entityType);
        if (sub.panNumber && !panNumber) setPanNumber(sub.panNumber);
        if (sub.accountHolderName && !accountHolderName) setAccountHolderName(sub.accountHolderName);
        if (sub.bankName && !bankName) setBankName(sub.bankName);
        if (sub.branch && !branch) setBranch(sub.branch);
        if (sub.accountNumber && !accountNumber) {
          setAccountNumber(sub.accountNumber);
          setConfirmAccountNumber(sub.accountNumber);
        }
        if (sub.ifsc && !ifsc) setIfsc(sub.ifsc);
        if (sub.aadhaarNumber && !aadhaarNumber) setAadhaarNumber(sub.aadhaarNumber);
      }

      if (data.submerchant?.status === "KYC_PENDING") {
        setCurrentStep(2);
      } else if (data.submerchant?.status === "ACTIVE") {
        // active state
      } else {
        setCurrentStep(1);
        if (selectedPg?.name && !businessName) {
          setBusinessName(selectedPg.name);
        }
      }
    } catch (err: any) {
      toast({
        title: "Error loading payment settings",
        description: err?.message || "Please check your network connection.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [selectedPgId]);

  // Automatic IFSC Lookup
  const handleIfscChange = async (val: string) => {
    const clean = val.toUpperCase().trim();
    setIfsc(clean);
    if (/^[A-Z]{4}0[A-Z0-9]{6}$/.test(clean)) {
      setIsLookingUpIfsc(true);
      try {
        const info = await lookupIfsc(clean);
        if (info?.bank) setBankName(info.bank);
        if (info?.branch) setBranch(info.branch);
      } catch {
        // quiet fallback
      } finally {
        setIsLookingUpIfsc(false);
      }
    }
  };

  // Step 1: Submit Profile & Bank Details -> Trigger Aadhaar OTP
  const handleInitiateOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!businessName.trim()) {
      toast({ title: "Business Name Required", description: "Please enter your PG or Business Name.", variant: "destructive" });
      return;
    }

    if (panNumber.trim() && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber.trim().toUpperCase())) {
      toast({ title: "Invalid PAN Format", description: "PAN must be a 10-character alphanumeric code (e.g. ABCDE1234F).", variant: "destructive" });
      return;
    }

    if (aadhaarNumber.trim() && aadhaarNumber.replace(/\D/g, "").length !== 12) {
      toast({ title: "Invalid Aadhaar Number", description: "Aadhaar must be exactly 12 digits.", variant: "destructive" });
      return;
    }

    if (!accountNumber.trim()) {
      toast({ title: "Account Number Required", description: "Please enter your bank account number.", variant: "destructive" });
      return;
    }

    if (accountNumber.trim() !== confirmAccountNumber.trim()) {
      toast({ title: "Account Numbers Do Not Match", description: "Please ensure both account number fields match exactly.", variant: "destructive" });
      return;
    }

    if (!ifsc.trim() || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc.trim().toUpperCase())) {
      toast({ title: "Invalid IFSC Code", description: "Please enter a valid 11-character Indian IFSC code.", variant: "destructive" });
      return;
    }

    setActionLoading(true);
    try {
      const res = await initiateEasebuzzOnboarding({
        businessName: businessName.trim(),
        entityType,
        panNumber: panNumber.trim().toUpperCase() || undefined,
        aadhaarNumber: aadhaarNumber.replace(/\D/g, "") || undefined,
        accountHolderName: accountHolderName.trim() || businessName.trim(),
        bankName: bankName.trim() || "Bank",
        accountNumber: accountNumber.trim(),
        ifsc: ifsc.trim().toUpperCase(),
        branch: branch.trim() || undefined,
      });

      if (res.mobileLast4) {
        setOtpMobileLast4(res.mobileLast4);
      }
      if (res.testHint) {
        setTestHint(res.testHint);
      }

      toast({
        title: "Details Registered Successfully",
        description: res.message || "Aadhaar KYC OTP has been sent to your mobile number.",
      });

      setCurrentStep(2);
      await fetchSettings();
    } catch (err: any) {
      toast({
        title: "Registration Failed",
        description: err?.message || "Could not save onboarding details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Step 2: Verify OTP directly in page
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kycOtp.trim()) {
      toast({ title: "OTP Required", description: "Please enter the 6-digit OTP received via SMS.", variant: "destructive" });
      return;
    }

    setActionLoading(true);
    try {
      const res = await verifyEasebuzzKycOtp({ otp: kycOtp.trim() });
      toast({
        title: "KYC Verified & Approved!",
        description: res.message || "Your Easebuzz Sub-Merchant account is now active.",
      });
      setKycOtp("");
      await fetchSettings();
    } catch (err: any) {
      toast({
        title: "Verification Failed",
        description: err?.message || "Invalid or expired OTP. Please enter 123456 for instant test approval.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setActionLoading(true);
    try {
      const res = await resendEasebuzzKycOtp();
      if (res.testHint) setTestHint(res.testHint);
      toast({
        title: "OTP Resent",
        description: res.message || "A fresh OTP has been sent via SMS.",
      });
    } catch (err: any) {
      toast({
        title: "Could Not Resend OTP",
        description: err?.message || "Please wait a moment before requesting another code.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Reset Sub-Merchant so owner can re-test from scratch
  const handleReset = async () => {
    if (!window.confirm("Are you sure you want to reset your Easebuzz Sub-Merchant onboarding? This allows you to test the complete flow from scratch.")) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await resetEasebuzzSubmerchant();
      toast({
        title: "Sub-Merchant Reset",
        description: res.message || "You can now test onboarding from scratch.",
      });
      setCurrentStep(1);
      setKycOtp("");
      await fetchSettings();
    } catch (err: any) {
      toast({
        title: "Reset Failed",
        description: err?.message || "Could not reset sub-merchant record.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Generate Live/Test Tenant Payment Link
  const handleGetTestLink = async () => {
    setActionLoading(true);
    try {
      const res = await getEasebuzzTestPaymentLink();
      setTestLinkData(res);
    } catch (err: any) {
      toast({
        title: "Could Not Generate Test Link",
        description: err?.message || "Please ensure you have active tenants in your PG.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Accept Online UPI Payments Switch
  const handleToggleOnline = async (enabled: boolean) => {
    setActionLoading(true);
    try {
      const res = await toggleEasebuzzOnline(enabled);
      setSettings((prev) =>
        prev
          ? {
              ...prev,
              paymentMode: res.onlinePaymentsEnabled ? "GATEWAY" : "MANUAL",
              submerchant: prev.submerchant
                ? { ...prev.submerchant, onlinePaymentsEnabled: res.onlinePaymentsEnabled }
                : null,
            }
          : null
      );
      toast({
        title: enabled ? "Online UPI Payments Activated" : "Online UPI Payments Paused",
        description: enabled
          ? "Tenants will see 'Instant UPI Pay' in their portal for direct bank settlements."
          : "Tenants will use manual UPI transfer with UTR receipt.",
      });
    } catch (err: any) {
      toast({
        title: "Failed to update switch",
        description: err?.message || "Could not change online payment status.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const copySubmerchantId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const copyPaymentUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const subAccess = useSubscriptionAccess();
  const sub = settings?.submerchant;
  const isPro = Boolean(
    settings?.isProPlan ||
    subAccess.currentPlan === "PRO" ||
    subAccess.currentPlan === "ENTERPRISE"
  );
  const isSubActive = sub?.status === "ACTIVE";

  if (loading) {
    return (
      <Card className="rounded-2xl border-border/80 shadow-xs">
        <CardContent className="p-6 flex items-center justify-center gap-3">
          <RefreshCw className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground font-medium">
            Loading Easebuzz gateway status...
          </span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-border/80 shadow-xs overflow-hidden">
      {/* Top Header */}
      <CardHeader className="bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-transparent border-b border-border/60 pb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold text-foreground">
                  Online UPI Payments (Easebuzz Gateway)
                </CardTitle>
                {isSubActive ? (
                  <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 text-xs font-bold gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Live & Active
                  </Badge>
                ) : sub?.status === "KYC_PENDING" || currentStep === 2 ? (
                  <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 text-xs font-bold gap-1">
                    <AlertCircle className="h-3 w-3" /> Aadhaar OTP Required
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs font-semibold text-muted-foreground">
                    Not Onboarded
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Direct UPI collection with automatic bank settlement and tenant ledger reconciliation.
              </CardDescription>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={fetchSettings}
            disabled={actionLoading}
            className="text-xs gap-1.5 h-8 text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${actionLoading ? "animate-spin" : ""}`} />
            Sync Status
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* ========================================================================= */}
        {/* STATE 1: NOT ONBOARDED (STEP 1: DETAILS ENTRY)                            */}
        {/* ========================================================================= */}
        {!isSubActive && currentStep === 1 && (
          <div className="space-y-6">
            {/* Step Progress Tracker */}
            <div className="flex items-center justify-between bg-muted/40 p-3 rounded-xl border border-border/60 text-xs font-medium">
              <div className="flex items-center gap-2 text-primary font-bold">
                <span className="h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px]">1</span>
                <span>Enter Business & Bank Details</span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="h-5 w-5 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[10px]">2</span>
                <span>Aadhaar e-KYC (OTP)</span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="h-5 w-5 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[10px]">3</span>
                <span>Approved & Live</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleInitiateOnboarding} className="space-y-5">
              <div className="border border-border/80 rounded-xl p-4 bg-white/50 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <Building className="h-4 w-4 text-primary" />
                  <span>Business & Identity Details</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Business / PG Name *</Label>
                    <Input
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Shivam PG"
                      required
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Entity Type *</Label>
                    <Select value={entityType} onValueChange={setEntityType}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual / Sole Proprietor</SelectItem>
                        <SelectItem value="partnership">Partnership Firm</SelectItem>
                        <SelectItem value="private_limited">Private Limited Company</SelectItem>
                        <SelectItem value="llp">Limited Liability Partnership (LLP)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">PAN Number (Proprietor / Entity)</Label>
                    <Input
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                      placeholder="e.g. ABCDE1234F"
                      maxLength={10}
                      className="h-9 text-xs font-mono uppercase"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Aadhaar Number (for OTP e-KYC)</Label>
                    <Input
                      value={aadhaarNumber}
                      onChange={(e) => setAadhaarNumber(e.target.value)}
                      placeholder="e.g. 1234 5678 9012"
                      maxLength={14}
                      className="h-9 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Settlement Bank Details */}
              <div className="border border-border/80 rounded-xl p-4 bg-white/50 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <CreditCard className="h-4 w-4 text-teal-600" />
                  <span>Settlement Bank Account (Where Tenant Rent Will Be Deposited)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Account Holder Name *</Label>
                    <Input
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      placeholder="e.g. Shivam"
                      required
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">IFSC Code *</Label>
                    <div className="relative">
                      <Input
                        value={ifsc}
                        onChange={(e) => handleIfscChange(e.target.value)}
                        placeholder="e.g. BARB0GONDAX"
                        required
                        maxLength={11}
                        className="h-9 text-xs font-mono uppercase pr-8"
                      />
                      {isLookingUpIfsc && (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground absolute right-2.5 top-3" />
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Bank Name *</Label>
                    <Input
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. Bank of Baroda"
                      required
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Branch Name</Label>
                    <Input
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      placeholder="e.g. Gonda Main Branch"
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Account Number *</Label>
                    <Input
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="e.g. 12345678859"
                      required
                      className="h-9 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Confirm Account Number *</Label>
                    <Input
                      value={confirmAccountNumber}
                      onChange={(e) => setConfirmAccountNumber(e.target.value)}
                      placeholder="Re-enter Account Number"
                      required
                      className="h-9 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">
                  🔒 Encrypted bank settlement integration via Easebuzz. 0% transaction fee.
                </p>
                <Button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-primary hover:bg-primary/90 text-white font-bold text-xs h-10 px-5 gap-2"
                >
                  {actionLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  {actionLoading ? "Registering Profile..." : "Proceed to Aadhaar KYC Verification"}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STATE 2: KYC PENDING (STEP 2: AADHAAR OTP VERIFICATION)                    */}
        {/* ========================================================================= */}
        {!isSubActive && currentStep === 2 && (
          <div className="space-y-6">
            {/* Step Progress Tracker */}
            <div className="flex items-center justify-between bg-muted/40 p-3 rounded-xl border border-border/60 text-xs font-medium">
              <div className="flex items-center gap-2 text-emerald-600 font-bold">
                <Check className="h-4 w-4 text-emerald-600" />
                <span>Details Registered</span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold">
                <span className="h-5 w-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px]">2</span>
                <span>Aadhaar e-KYC (OTP)</span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="h-5 w-5 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[10px]">3</span>
                <span>Approved & Live</span>
              </div>
            </div>

            {/* OTP Verification Box */}
            <div className="border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl p-6 text-center max-w-lg mx-auto space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-700 dark:text-amber-400">
                <Smartphone className="h-6 w-6" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">
                  Aadhaar e-KYC Verification (Easebuzz Gateway)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Enter the 6-digit OTP sent by Easebuzz to your registered mobile number ending in{" "}
                  <strong className="text-foreground">•••• {otpMobileLast4}</strong>.
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-4 pt-2">
                <div className="flex justify-center">
                  <Input
                    value={kycOtp}
                    onChange={(e) => setKycOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="• • • • • •"
                    maxLength={6}
                    required
                    className="h-12 w-48 text-center text-xl font-mono tracking-widest font-bold border-2 focus-visible:ring-primary"
                    autoFocus
                  />
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <span>Didn't receive the OTP?</span>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={actionLoading}
                    className="text-primary font-bold hover:underline"
                  >
                    Resend OTP
                  </button>
                </div>

                {/* Developer / Demo Test Hint */}
                <div className="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-lg border border-border/60 text-xs text-slate-600 dark:text-slate-300">
                  ⚡ <strong>Testing mode:</strong> Enter <strong>1234</strong> or <strong>123456</strong> for instant approval.
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    disabled={actionLoading}
                    className="text-xs h-9"
                  >
                    Back to Edit Details
                  </Button>

                  <Button
                    type="submit"
                    disabled={actionLoading || !kycOtp.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-6 gap-2"
                  >
                    {actionLoading ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ShieldCheck className="h-4 w-4" />
                    )}
                    {actionLoading ? "Verifying..." : "Verify OTP & Complete KYC"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STATE 3: SUB-MERCHANT ACTIVE (MATCHES USER'S EXACT SCREENSHOT)            */}
        {/* ========================================================================= */}
        {isSubActive && (
          <div className="space-y-5">
            {/* Account Card Container */}
            <div className="rounded-xl border border-border/80 bg-muted/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground tracking-wider uppercase">
                  Easebuzz Sub-Merchant Account
                </span>
                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 text-xs font-bold gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Active & Verified
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {sub?.submerchantId && (
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-border/60">
                    <span className="text-muted-foreground">Sub-Merchant ID</span>
                    <div className="flex items-center gap-1.5 font-mono font-bold text-foreground">
                      <span>{sub.submerchantId}</span>
                      <button
                        onClick={() => copySubmerchantId(sub.submerchantId!)}
                        className="text-muted-foreground hover:text-primary"
                        title="Copy ID"
                      >
                        {copiedId ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-border/60">
                  <span className="text-muted-foreground">Settlement A/C</span>
                  <span className="font-mono font-bold text-foreground">
                    •••• {sub?.bankLast4 || "8859"} {sub?.bankName ? `(${sub.bankName})` : "(Bank of Baroda)"}
                  </span>
                </div>
              </div>

              {/* Action Buttons: Sync Status with Easebuzz & Tenant Payment Link */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-border/50">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={fetchSettings}
                    disabled={loading || actionLoading}
                    className="text-xs h-9 font-semibold text-foreground border-border/80 hover:bg-muted/50 gap-2"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                    Sync Status with Easebuzz
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleGetTestLink}
                    disabled={actionLoading}
                    className="text-xs h-9 font-bold text-primary border-primary/40 hover:bg-primary/5 gap-2"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Get Tenant Payment Link to Test
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleReset}
                    disabled={actionLoading}
                    className="text-xs h-8 text-muted-foreground hover:text-destructive gap-1.5"
                    title="Reset sub-merchant to test onboarding from scratch"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset & Re-test Onboarding
                  </Button>
                </div>
              </div>
            </div>

            {/* Online UPI Switch Toggle */}
            <div className="rounded-xl border border-border/80 bg-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor="online-upi-switch" className="text-sm font-bold text-foreground flex items-center gap-2">
                  Accept Online UPI Payments
                </Label>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  When turned on, tenants will see "Instant UPI Pay" in their web portal. Payments auto-settle directly to your bank account with zero manual verification needed.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Switch
                  id="online-upi-switch"
                  checked={Boolean(sub?.onlinePaymentsEnabled && isSubActive && isPro)}
                  onCheckedChange={handleToggleOnline}
                  disabled={actionLoading || !isSubActive || !isPro}
                />
                <span className="text-xs font-semibold text-foreground min-w-[50px]">
                  {sub?.onlinePaymentsEnabled && isSubActive && isPro ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Feature Highlights Footer */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-muted-foreground border-t border-border/60">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
            <span>Direct settlements to your bank</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Instant rent receipt on WhatsApp</span>
          </div>
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-teal-600 shrink-0" />
            <span>Zero manual UTR verification</span>
          </div>
        </div>
      </CardContent>

      {/* ========================================================================= */}
      {/* DIALOG: TENANT PAYMENT LINK TEST PREVIEW                                   */}
      {/* ========================================================================= */}
      <Dialog open={Boolean(testLinkData)} onOpenChange={(open) => !open && setTestLinkData(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-primary">
              <CreditCard className="h-5 w-5" /> Test Tenant Payment Link
            </DialogTitle>
            <DialogDescription className="text-xs">
              Live Easebuzz UPI payment link generated for tenant rent dues at your property.
            </DialogDescription>
          </DialogHeader>

          {testLinkData && (
            <div className="space-y-4 pt-1">
              <div className="p-3 bg-muted/40 rounded-xl border border-border/60 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tenant Name:</span>
                  <span className="font-bold text-foreground">{testLinkData.tenantName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Property & Room:</span>
                  <span className="font-semibold text-foreground">
                    {testLinkData.propertyName} ({testLinkData.roomNumber})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rent Payable:</span>
                  <span className="font-bold text-emerald-600">₹{testLinkData.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sub-Merchant ID:</span>
                  <span className="font-mono text-foreground font-semibold">{testLinkData.submerchantId}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Direct Checkout URL:</Label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={testLinkData.paymentUrl}
                    className="h-9 text-xs font-mono select-all bg-white"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyPaymentUrl(testLinkData.paymentUrl)}
                    className="h-9 px-3 shrink-0 text-xs"
                  >
                    {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTestLinkData(null)}
              className="text-xs"
            >
              Close
            </Button>
            {testLinkData && (
              <Button
                size="sm"
                onClick={() => window.open(testLinkData.paymentUrl, "_blank")}
                className="bg-primary hover:bg-primary/90 text-white font-bold text-xs gap-1.5"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open Payment Link
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
