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
  refreshEasebuzzKycLink,
  syncEasebuzzStatus,
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

  // In-Page Multi-Step State: 1 = Details Entry, 2 = KYC Pending on Easebuzz
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

  // Official Easebuzz KYC Link State
  const [kycDashboardUrl, setKycDashboardUrl] = useState("");
  const [copiedKycUrl, setCopiedKycUrl] = useState(false);

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
        if (sub.kycDashboardUrl) setKycDashboardUrl(sub.kycDashboardUrl);
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

  // Step 1: Submit Profile & Bank Details -> Create Sub-Merchant & Generate KYC Link
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

      const kycUrl = res.kycUrl || res.kycDashboardUrl || "";
      if (kycUrl) {
        setKycDashboardUrl(kycUrl);
      }

      toast({
        title: "Sub-Merchant Created on Easebuzz",
        description: res.message || "Please complete KYC verification on the Easebuzz portal.",
      });

      setCurrentStep(2);
      await fetchSettings();

      if (kycUrl) {
        window.open(kycUrl, "_blank");
      }
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

  // Step 2 Action: Refresh KYC Link via API 2
  const handleRefreshKycLink = async () => {
    setActionLoading(true);
    try {
      const res = await refreshEasebuzzKycLink();
      const freshUrl = res.kycUrl || res.kycDashboardUrl || "";
      if (freshUrl) {
        setKycDashboardUrl(freshUrl);
      }
      toast({
        title: "KYC Link Refreshed",
        description: res.message || "Fresh Easebuzz KYC portal access key generated.",
      });
      await fetchSettings();
      if (freshUrl) {
        window.open(freshUrl, "_blank");
      }
    } catch (err: any) {
      toast({
        title: "Could Not Refresh KYC Link",
        description: err?.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Sync Status with Easebuzz live probe
  const handleSyncStatus = async () => {
    setActionLoading(true);
    try {
      const res = await syncEasebuzzStatus();
      if (res.status === "ACTIVE") {
        toast({
          title: "KYC Approved & Active!",
          description: "Your Easebuzz Sub-Merchant account is now verified and active.",
        });
      } else {
        toast({
          title: "Status Checked",
          description: "Easebuzz verification is still pending. Please complete KYC on the Easebuzz portal.",
        });
      }
      await fetchSettings();
    } catch (err: any) {
      toast({
        title: "Sync Failed",
        description: err?.message || "Could not check verification status.",
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
                  {actionLoading ? "Registering on Easebuzz..." : "Register Sub-Merchant & Open KYC Portal"}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STATE 2: KYC PENDING (OFFICIAL EASEBUZZ KYC PORTAL ACCESS)                 */}
        {/* ========================================================================= */}
        {!isSubActive && (sub?.status === "KYC_PENDING" || currentStep === 2) && (
          <div className="space-y-6">
            {/* Step Progress Tracker */}
            <div className="flex items-center justify-between bg-muted/40 p-3 rounded-xl border border-border/60 text-xs font-medium">
              <div className="flex items-center gap-2 text-emerald-600 font-bold">
                <Check className="h-4 w-4 text-emerald-600" />
                <span>1. Profile & Bank Registered</span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold">
                <span className="h-5 w-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px]">2</span>
                <span>2. Complete KYC on Easebuzz</span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="h-5 w-5 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[10px]">3</span>
                <span>3. Live & Approved</span>
              </div>
            </div>

            {/* Sub-Merchant Identity Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {sub?.submerchantId && (
                <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-border/70 shadow-2xs">
                  <span className="text-muted-foreground font-medium">Sub-Merchant ID</span>
                  <div className="flex items-center gap-1.5 font-mono font-bold text-foreground">
                    <span>{sub.submerchantId}</span>
                    <button
                      onClick={() => copySubmerchantId(sub.submerchantId!)}
                      className="text-muted-foreground hover:text-primary"
                      title="Copy Sub-Merchant ID"
                    >
                      {copiedId ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-border/70 shadow-2xs">
                <span className="text-muted-foreground font-medium">Settlement Account</span>
                <span className="font-mono font-bold text-foreground">
                  {sub?.bankLast4 || accountNumber.slice(-4) ? `•••• ${sub?.bankLast4 || accountNumber.slice(-4)}` : "Not added"}{sub?.bankName || bankName ? ` (${sub?.bankName || bankName})` : ""}
                </span>
              </div>
            </div>

            {/* Official Easebuzz KYC Action Box */}
            <div className="rounded-xl border bg-white p-5 space-y-4">
              <div>
                <h3 className="text-base font-semibold text-foreground">Finish KYC on Easebuzz</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your bank details are saved. Easebuzz still has to verify you before tenants can pay online.
                </p>
              </div>
              <ol className="space-y-2 text-sm text-foreground">
                <li className="flex gap-2"><span className="font-semibold text-[#008080]">1.</span> Open the Easebuzz page. It asks for Aadhaar OTP.</li>
                <li className="flex gap-2"><span className="font-semibold text-[#008080]">2.</span> Enter PAN and confirm the settlement account.</li>
                <li className="flex gap-2"><span className="font-semibold text-[#008080]">3.</span> Come back here and press Check status. Online collection turns on after Easebuzz approves it.</li>
              </ol>

              {/* Main Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Button
                  type="button"
                  onClick={() => {
                    const url = kycDashboardUrl || sub?.kycDashboardUrl;
                    if (url) {
                      window.open(url, "_blank");
                    } else {
                      handleRefreshKycLink();
                    }
                  }}
                  disabled={actionLoading}
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white font-bold text-xs h-10 px-6 gap-2 shadow-sm"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Easebuzz KYC
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRefreshKycLink}
                  disabled={actionLoading}
                  className="w-full sm:w-auto text-xs h-10 font-semibold gap-2 border-border/80"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${actionLoading ? "animate-spin" : ""}`} />
                  Refresh KYC Link
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSyncStatus}
                  disabled={actionLoading}
                  className="w-full sm:w-auto text-xs h-10 font-bold text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Check status
                </Button>
              </div>

              {/* Direct Link Preview & Copy */}
              {(kycDashboardUrl || sub?.kycDashboardUrl) && (
                <div className="pt-3 border-t border-amber-200/60 dark:border-amber-900/40 text-left space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground flex items-center justify-between">
                    <span>Direct Easebuzz KYC Portal URL:</span>
                    <span className="text-[10px] text-muted-foreground">Opens secure hosted verification</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={kycDashboardUrl || sub?.kycDashboardUrl || ""}
                      className="h-8 text-[11px] font-mono bg-white select-all text-muted-foreground"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const url = kycDashboardUrl || sub?.kycDashboardUrl || "";
                        navigator.clipboard.writeText(url);
                        setCopiedKycUrl(true);
                        setTimeout(() => setCopiedKycUrl(false), 2000);
                        toast({ title: "Link Copied", description: "Paste this link in any browser tab to complete KYC." });
                      }}
                      className="h-8 px-3 shrink-0 text-xs"
                    >
                      {copiedKycUrl ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
              )}

              {/* Reset or Edit options */}
              <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs text-muted-foreground">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStep(1)}
                  disabled={actionLoading}
                  className="text-xs h-8 text-muted-foreground hover:text-foreground"
                >
                  Edit Bank Details
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  disabled={actionLoading}
                  className="text-xs h-8 text-muted-foreground hover:text-destructive gap-1.5"
                >
                  <RotateCcw className="h-3 w-3" />
                  Start again
                </Button>
              </div>
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
                    {sub?.bankLast4 ? `•••• ${sub.bankLast4}` : "Not added"}{sub?.bankName ? ` (${sub.bankName})` : ""}
                  </span>
                </div>
              </div>

              {/* Action Buttons: Sync Status with Easebuzz & Tenant Payment Link */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-border/50">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSyncStatus}
                    disabled={loading || actionLoading}
                    className="text-xs h-9 font-semibold text-foreground border-border/80 hover:bg-muted/50 gap-2"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${actionLoading ? "animate-spin" : ""}`} />
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
