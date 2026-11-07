import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Loader2,
  ShieldCheck,
  FileText,
  Plus,
  CreditCard,
  Send,
  Download,
  ExternalLink,
  UserCheck,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  Coins,
  Wallet,
  History,
  Sparkles,
  Gift,
  ArrowUpRight,
  ArrowDownRight,
  BadgeAlert,
  X,
} from "lucide-react";
import { CreditTransaction } from "@/api/propertyOwner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/common/PageHeader";
import { MetricDisplay } from "@/components/common/MetricDisplay";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ActionMenu } from "@/components/common/ActionMenu";
import { EmptyState } from "@/components/common/EmptyState";
import {
  useApproveKycMutation,
  useKycApplications,
  useKycDetail,
  useRejectKycMutation,
  useCreditBalance,
  useCreditPacks,
  useCreateCreditTopupOrderMutation,
  useVerifyCreditPaymentMutation,
  useRequestTenantKycMutation,
  usePropertyAgreements,
  useCreateAgreementMutation,
  useSendAgreementEsignMutation,
  usePropertyTenants,
} from "@/hooks/usePropertyOwnerQueries";
import { useApp } from "@/context/AppContext";
import { toast } from "@/components/ui/use-toast";
import { CanAccess, CanAccessPage } from "@/components/PermissionGuard";
import { useEntitlements } from "@/hooks/useEntitlements";
import { FeatureGuard } from "@/components/common/FeatureGuard";
import { TrialExpiredGateModal } from "@/components/common/TrialExpiredGateModal";
import { formatINR, formatDate } from "@/lib/formatters";
import { launchEasebuzzCheckout } from "@/lib/easebuzzCheckout";

declare global {
  interface Window {
    Razorpay?: any;
    EasebuzzCheckout?: any;
  }
}

function formatDateTime(dateInput?: string | Date | null) {
  if (!dateInput) return "—";
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "—";
  }
}

function getTransactionTypeBadge(type: string) {
  switch (type) {
    case "admin_adjustment":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Sparkles className="h-3 w-3 text-emerald-600" /> Admin Quota Grant
        </span>
      );
    case "usage":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
          <ShieldCheck className="h-3 w-3 text-slate-500" /> KYC requested
        </span>
      );
    case "purchase":
    case "topup":
    case "razorpay_topup":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <CreditCard className="h-3 w-3 text-blue-600" /> Credit purchase
        </span>
      );
    case "admin_grant":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Sparkles className="h-3 w-3 text-emerald-600" /> Credits granted
        </span>
      );
    default: {
      const label = String(type || "Other").replace(/_/g, " ");
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 capitalize">
          {label}
        </span>
      );
    }
  }
}

export default function Kyc() {
  const { selectedPgId: currentPropertyId } = useApp();
  const entitlements = useEntitlements();
  const [trialExpiredOpen, setTrialExpiredOpen] = useState(false);
  const [trialExpiredFeature, setTrialExpiredFeature] = useState("");
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"kyc" | "agreements" | "credits">(
    tabFromUrl === "agreements" || tabFromUrl === "credits" ? tabFromUrl : "kyc",
  );

  // KYC Queries & Mutations
  const { data: kycRows = [], isLoading: isKycLoading, refetch: refetchKyc } = useKycApplications();
  const approveMut = useApproveKycMutation();
  const rejectMut = useRejectKycMutation();
  const [detailId, setDetailId] = useState<string | null>(null);
  const detailQuery = useKycDetail(detailId);
  const kycDetail = detailQuery.data as any;

  // Credit Balance & Topup
  const { data: balanceData, isLoading: isBalanceLoading } = useCreditBalance();
  const { data: packsData } = useCreditPacks();
  const topupOrderMut = useCreateCreditTopupOrderMutation();
  const verifyPaymentMut = useVerifyCreditPaymentMutation();
  const [topupOpen, setTopupOpen] = useState(false);
  const [selectedPackId, setSelectedPackId] = useState<string>("");
  const [selectedGateway, setSelectedGateway] = useState<"easebuzz" | "razorpay">("easebuzz");

  // Request KYC Modal
  const [requestKycOpen, setRequestKycOpen] = useState(false);
  const [selectedTenantForKyc, setSelectedTenantForKyc] = useState<string>("");
  const requestKycMut = useRequestTenantKycMutation();
  const { data: tenantsData = [] } = usePropertyTenants(currentPropertyId);

  // Agreements Queries & Mutations
  const { data: agreementsData, isLoading: isAgreementsLoading, refetch: refetchAgreements } =
    usePropertyAgreements(currentPropertyId);
  const createAgreementMut = useCreateAgreementMutation(currentPropertyId);
  const sendEsignMut = useSendAgreementEsignMutation(currentPropertyId ?? undefined);
  const [createAgreementOpen, setCreateAgreementOpen] = useState(false);
  const [agreementForm, setAgreementForm] = useState({
    roomTenantId: "",
    monthlyRent: 12000,
    securityDeposit: 15000,
    noticePeriodDays: 30,
    lockInPeriodMonths: 3,
    agreementStartDate: new Date().toISOString().split("T")[0],
    agreementEndDate: "",
    houseRules: "1. No loud music after 10 PM.\n2. Visitors allowed until 8 PM.\n3. Keep common areas tidy.",
  });

  const kycList = Array.isArray(kycRows) ? (kycRows as Record<string, any>[]) : [];
  const [agreementStatus, setAgreementStatus] = useState("all");
  const agreementsList = (agreementsData?.agreements || []).filter((ag) => {
    if (!String(ag.tenantName || "").trim()) return false;
    if (agreementStatus === "all") return true;
    const status = String(ag.status || "draft").toLowerCase();
    if (agreementStatus === "draft") return status === "draft";
    if (agreementStatus === "sent") return status.includes("sent") || status.includes("sign");
    if (agreementStatus === "signed") return status === "signed";
    if (agreementStatus === "cancelled") return status === "rejected" || status === "expired" || status === "cancelled";
    return true;
  });
  const creditPacks = (Array.isArray(packsData) ? packsData : packsData?.creditPacks) || [];

  const verifiedKycCount = kycList.filter((r) => {
    const s = String(r.status || "").toLowerCase();
    return s === "completed" || s === "approved" || r.processing_done;
  }).length;

  const pendingKycCount = kycList.length - verifiedKycCount;

  // Credit quota breakdown & transactions from real backend API:
  const freeCreditsGiven = Number(balanceData?.freeCreditsGiven ?? balanceData?.freeCreditsAllocated ?? 5);
  const freeCreditsUsed = Number(balanceData?.freeCreditsUsed ?? 0);
  const freeCreditsRemaining = Number(balanceData?.freeCreditsRemaining ?? 0);
  const paidCreditsBalance = Number(balanceData?.paidCreditsBalance ?? balanceData?.topupCreditsRemaining ?? 0);
  const totalCreditsAvailable = Number(
    balanceData?.totalCreditsAvailable ??
    balanceData?.remainingCredits ??
    (freeCreditsRemaining + paidCreditsBalance)
  );
  const totalCreditsUsed = Number(balanceData?.totalCreditsUsed ?? freeCreditsUsed);
  const recentTransactions = (Array.isArray(balanceData?.recentTransactions)
    ? balanceData.recentTransactions
    : []) as CreditTransaction[];
  const grantedCredits = recentTransactions.reduce((sum, tx) => {
    const type = String(tx.type || "");
    const credits = Number(tx.credits) || 0;
    if (credits > 0 && (type === "admin_grant" || type === "admin_adjustment")) return sum + credits;
    return sum;
  }, 0);
  const purchasedFromLedger = recentTransactions.reduce((sum, tx) => {
    const type = String(tx.type || "");
    const credits = Number(tx.credits) || 0;
    if (credits > 0 && (type === "purchase" || type === "topup" || type === "razorpay_topup")) return sum + credits;
    return sum;
  }, 0);
  const purchasedCredits = purchasedFromLedger > 0
    ? purchasedFromLedger
    : Math.max(0, paidCreditsBalance - grantedCredits);

  // Resolve standard plans from API or fallback (₹49 KYC Only & ₹99 KYC + Agreement)
  const aadharPackFromApi = creditPacks.find(
    (p: any) =>
      Number(p.price) === 49 ||
      (p.name?.toLowerCase().includes("aadhar") && !p.name?.toLowerCase().includes("agreement"))
  );
  const agreementPackFromApi = creditPacks.find(
    (p: any) =>
      Number(p.price) === 99 ||
      p.name?.toLowerCase().includes("agreement")
  );

  const standardPlans = [
    {
      id: aadharPackFromApi?.id || "aadhar-verification-49",
      apiPackId: aadharPackFromApi?.id,
      name: aadharPackFromApi?.name || "Aadhar Verification",
      price: Number(aadharPackFromApi?.price ?? 49),
      originalPrice: null,
      coinLabel: `${freeCreditsRemaining}/${freeCreditsGiven}`,
      description: "Instant DigiLocker Aadhaar KYC verification",
      actionLabel: "Buy Now",
      buttonVariant: "solid" as const,
    },
    {
      id: agreementPackFromApi?.id || "aadhar-agreement-99",
      apiPackId: agreementPackFromApi?.id,
      name: agreementPackFromApi?.name || "Aadhar Verification + Agreement",
      price: Number(agreementPackFromApi?.price ?? 99),
      originalPrice: 149,
      coinLabel: `${paidCreditsBalance > 0 ? paidCreditsBalance : "0/0"}`,
      description: "Aadhaar KYC + digital rental agreement drafting & eSign",
      actionLabel: "Upgrade",
      buttonVariant: "outline" as const,
    },
  ];

  const otherCreditPacks = creditPacks.filter(
    (p: any) => p.id !== aadharPackFromApi?.id && p.id !== agreementPackFromApi?.id
  );

  const handleBuyPlan = async (plan: (typeof standardPlans)[0]) => {
    if (plan.apiPackId) {
      await handleTopupCheckout(plan.apiPackId);
      return;
    }
    if (creditPacks.length > 0) {
      const matchingPack =
        creditPacks.find((p: any) => Number(p.price) === plan.price) ||
        creditPacks.find((p: any) =>
          plan.price === 49
            ? p.name?.toLowerCase().includes("aadhar") && !p.name?.toLowerCase().includes("agreement")
            : p.name?.toLowerCase().includes("agreement")
        );
      if (matchingPack) {
        await handleTopupCheckout(matchingPack.id);
        return;
      }
      await handleTopupCheckout(creditPacks[0].id);
      return;
    }
    toast({
      title: "Plan is being configured",
      description: "Standard KYC plans are being configured in the Admin Panel. Please initialize them or contact support.",
    });
  };

  // Top-up Checkout (Easebuzz / Razorpay)
  const handleTopupCheckout = async (packId: string) => {
    try {
      const order = await topupOrderMut.mutateAsync({ creditPackId: packId, gateway: selectedGateway });

      // ─── Easebuzz Flow ────────────────────────────────────────────────────────
      if (selectedGateway === "easebuzz") {
        if (!window.EasebuzzCheckout) {
          const script = document.createElement("script");
          script.src = "https://ebz-static.s3.ap-south-1.amazonaws.com/easecheckout/v2.0.0/easebuzz-checkout-v2.min.js";
          document.body.appendChild(script);
          await new Promise((resolve) => (script.onload = resolve));
        }

        launchEasebuzzCheckout(
          {
            key: order.key || order.keyId,
            access_key: order.access_key!,
            env: order.env || "test",
            txnid: order.txnid || order.orderId,
            amount: order.amount,
            is_sandbox: (order as any).is_sandbox,
          },
          {
            onSuccess: async (response_data: any) => {
              try {
                await verifyPaymentMut.mutateAsync({
                  packId,
                  creditPackId: packId,
                  gateway: "easebuzz",
                  txnid: response_data.txnid || order.orderId,
                  easebuzz_id: response_data.easebuzz_id,
                  hash: response_data.hash,
                  status: response_data.status,
                  easebuzz_response: response_data,
                });
                toast({
                  title: "Credits Recharged! ⚡",
                  description: "Your verification credits have been updated.",
                });
                setTopupOpen(false);
              } catch (err: any) {
                toast({
                  title: "Payment Verification Failed",
                  description: err?.message || "Please contact support if amount was deducted.",
                  variant: "destructive",
                });
              }
            },
            onFailure: (response_data: any) => {
              toast({
                title: "Payment Not Completed",
                description: response_data.error_Message || response_data.status || "Cancelled by user.",
                variant: "destructive",
              });
            },
          }
        );
        return;
      }

      // ─── Razorpay Flow ────────────────────────────────────────────────────────
      if (!window.Razorpay) {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        document.body.appendChild(script);
        await new Promise((resolve) => (script.onload = resolve));
      }

      const options = {
        key: order.keyId || "rzp_test_TUV3u84h3zOyxB",
        amount: order.amount,
        currency: order.currency || "INR",
        name: "PG Ease",
        description: "KYC & Verification Credits Top-up",
        order_id: order.orderId,
        handler: async (response: any) => {
          try {
            await verifyPaymentMut.mutateAsync({
              packId,
              creditPackId: packId,
              gateway: "razorpay",
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            toast({
              title: "Credits Recharged",
              description: "Your verification credits have been updated.",
            });
            setTopupOpen(false);
          } catch (err: any) {
            toast({
              title: "Payment Verification Failed",
              description: err?.message || "Please contact support if amount was deducted.",
              variant: "destructive",
            });
          }
        },
        theme: { color: "#008080" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast({
        title: "Failed to initiate top-up",
        description: err?.message || "Please try again later.",
        variant: "destructive",
      });
    }
  };

  // Request KYC Action
  const handleInitiateTenantKyc = async () => {
    if (entitlements.isExpired) {
      setTrialExpiredFeature("Tenant KYC");
      setTrialExpiredOpen(true);
      return;
    }
    if (!selectedTenantForKyc) {
      toast({ title: "Please select a tenant", variant: "destructive" });
      return;
    }
    try {
      await requestKycMut.mutateAsync(selectedTenantForKyc);
      toast({
        title: "KYC Request Sent",
        description: "Aadhaar DigiLocker verification link sent to tenant via WhatsApp.",
      });
      setRequestKycOpen(false);
      setSelectedTenantForKyc("");
      refetchKyc();
    } catch (err: any) {
      toast({
        title: "Failed to request KYC",
        description: err?.message || "Insufficient credits or invalid tenant.",
        variant: "destructive",
      });
    }
  };

  // Create Agreement Action
  const handleCreateAgreement = async () => {
    if (entitlements.isExpired) {
      setTrialExpiredFeature("Rental Agreements");
      setTrialExpiredOpen(true);
      return;
    }
    if (!agreementForm.roomTenantId) {
      toast({ title: "Select a tenant", variant: "destructive" });
      return;
    }
    try {
      const rules = agreementForm.houseRules
        .split("\n")
        .map((r) => r.trim())
        .filter(Boolean);

      await createAgreementMut.mutateAsync({
        roomTenantId: agreementForm.roomTenantId,
        monthlyRent: Number(agreementForm.monthlyRent),
        securityDeposit: Number(agreementForm.securityDeposit),
        noticePeriodDays: Number(agreementForm.noticePeriodDays),
        lockInPeriodMonths: Number(agreementForm.lockInPeriodMonths) || undefined,
        moveInDate: agreementForm.agreementStartDate,
        customRules: rules,
      });

      toast({
        title: "Rental Agreement Created",
        description: "Agreement generated and sent to tenant for e-Sign.",
      });
      setCreateAgreementOpen(false);
      refetchAgreements();
    } catch (err: any) {
      toast({
        title: "Failed to create agreement",
        description: err?.message || "Please check inputs.",
        variant: "destructive",
      });
    }
  };

  return (
    <CanAccessPage permission="kyc_view">
      <div className="space-y-6">
        <PageHeader
          title="KYC & Digital Agreements"
          description="Verify tenant identity with DigiLocker Aadhaar verification and manage digital rental agreements."
          action={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-[var(--gray-300)]"
                onClick={() => setTopupOpen(true)}
              >
                Top up credits
              </Button>
              {activeTab === "kyc" ? (
                <Button
                  size="sm"
                  className="bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white gap-2 font-medium"
                  onClick={() => {
                    if (entitlements.isExpired) {
                      setTrialExpiredFeature("Tenant KYC");
                      setTrialExpiredOpen(true);
                      return;
                    }
                    setRequestKycOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4" /> Request tenant KYC
                </Button>
              ) : activeTab === "agreements" ? (
                <Button
                  size="sm"
                  className="bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white gap-2 font-medium"
                  onClick={() => {
                    if (entitlements.isExpired) {
                      setTrialExpiredFeature("Rental Agreements");
                      setTrialExpiredOpen(true);
                      return;
                    }
                    setCreateAgreementOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4" /> Create agreement
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white gap-2 font-medium"
                  onClick={() => setTopupOpen(true)}
                >
                  <Sparkles className="h-4 w-4" /> Top up credits
                </Button>
              )}
            </div>
          }
        />

                    {/* Top Quota Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-[16px] md:rounded-lg border border-[var(--gray-200)] p-4 shadow-xs">
                <div className="flex items-center justify-between text-xs text-[var(--gray-500)] mb-1">
                  <span className="font-medium">Total Available Balance</span>
                  <Coins className="h-4 w-4 text-[var(--brand-600)]" />
                </div>
                <div className="text-2xl font-bold text-[var(--gray-900)] tabular-nums">
                  {isBalanceLoading ? "—" : totalCreditsAvailable}
                </div>
                <p className="text-xs text-[var(--gray-500)] mt-1">
                  Active for instant DigiLocker Aadhaar KYC
                </p>
              </div>

              <div className="bg-white rounded-[16px] md:rounded-lg border border-[var(--gray-200)] p-4 shadow-xs">
                <div className="flex items-center justify-between text-xs text-[var(--gray-500)] mb-1">
                  <span className="font-medium">Free Onboarding Quota</span>
                  <Gift className="h-4 w-4 text-amber-500" />
                </div>
                <div className="text-2xl font-bold text-amber-600 tabular-nums">
                  {freeCreditsRemaining} <span className="text-xs font-normal text-[var(--gray-500)]">left of {freeCreditsGiven}</span>
                </div>
                <div className="mt-2 w-full bg-[var(--gray-100)] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all"
                    style={{
                      width: `${freeCreditsGiven > 0 ? Math.min(100, (freeCreditsUsed / freeCreditsGiven) * 100) : 0}%`,
                    }}
                  />
                </div>
                <p className="text-[11px] text-[var(--gray-500)] mt-1.5 tabular-nums">
                  {freeCreditsUsed} used · {freeCreditsRemaining} remaining
                </p>
              </div>

              <div className="bg-white rounded-[16px] md:rounded-lg border border-[var(--gray-200)] p-4 shadow-xs">
                <div className="flex items-center justify-between text-xs text-[var(--gray-500)] mb-1">
                  <span className="font-medium">Purchased balance</span>
                  <Wallet className="h-4 w-4 text-teal-600" />
                </div>
                <div className="text-2xl font-bold text-teal-700 tabular-nums">
                  {purchasedCredits} <span className="text-xs font-normal text-[var(--gray-500)]">credits</span>
                </div>
                <p className="text-xs text-[var(--gray-500)] mt-1">
                  {grantedCredits > 0
                    ? `Granted separately: ${grantedCredits}. Purchased credits do not expire.`
                    : "Non-expiring · Used after free quota"}
                </p>
              </div>

              <div className="bg-white rounded-[16px] md:rounded-lg border border-[var(--gray-200)] p-4 shadow-xs">
                <div className="flex items-center justify-between text-xs text-[var(--gray-500)] mb-1">
                  <span className="font-medium">Total Consumed</span>
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-bold text-[var(--gray-900)] tabular-nums">
                  {totalCreditsUsed} <span className="text-xs font-normal text-[var(--gray-500)]">verifications</span>
                </div>
                <p className="text-xs text-[var(--gray-500)] mt-1">
                  Tenants verified across properties
                </p>
              </div>
            </div>



        {/* Tabs Bar */}
        <div className="flex flex-wrap items-center gap-1 border-b border-[var(--gray-200)] pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("kyc")}
            className={`min-h-11 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === "kyc"
                ? "bg-[var(--brand-50)] text-[var(--brand-700)] font-semibold"
                : "text-[var(--gray-600)] hover:text-[var(--gray-900)] hover:bg-[var(--gray-100)]"
            }`}
          >
            Aadhaar KYC ({kycList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("agreements")}
            className={`min-h-11 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === "agreements"
                ? "bg-[var(--brand-50)] text-[var(--brand-700)] font-semibold"
                : "text-[var(--gray-600)] hover:text-[var(--gray-900)] hover:bg-[var(--gray-100)]"
            }`}
          >
            Rental Agreements ({agreementsList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("credits")}
            className={`min-h-11 px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === "credits"
                ? "bg-[var(--brand-50)] text-[var(--brand-700)] font-semibold"
                : "text-[var(--gray-600)] hover:text-[var(--gray-900)] hover:bg-[var(--gray-100)]"
            }`}
          >
            <span>Credits & Passbook</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[11px] font-bold tabular-nums ${
                activeTab === "credits"
                ? "bg-[var(--brand-50)] text-[var(--brand-700)] font-semibold"
                : "text-[var(--gray-600)] hover:text-[var(--gray-900)] hover:bg-[var(--gray-100)]"
              }`}
            >
              ({totalCreditsAvailable})
            </span>
          </button>
        </div>

        {/* TAB 1: KYC APPLICATIONS */}
        {activeTab === "kyc" && (
          <div className="bg-white rounded-[16px] md:rounded-md border border-[var(--gray-200)] p-4 space-y-4">
            {isKycLoading ? (
              <div className="flex justify-center py-16 text-sm text-[var(--gray-500)]">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-600)] mr-2" />
                Loading KYC records...
              </div>
            ) : kycList.length === 0 ? (
              <EmptyState
                icon={<UserCheck className="h-10 w-10 text-[var(--gray-400)]" />}
                title="No KYC applications yet"
                description="Send instant DigiLocker Aadhaar verification links to your tenants via WhatsApp."
                action={
                  <Button
                    size="sm"
                    className="bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white"
                    onClick={() => setRequestKycOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-1.5" /> Request tenant KYC
                  </Button>
                }
              />
            ) : (
              <div className="overflow-x-auto rounded border border-[var(--gray-200)]">
                <Table>
                  <TableHeader className="bg-[var(--gray-100)] text-xs text-[var(--gray-600)]">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="py-2.5 px-3">Tenant Details</TableHead>
                      <TableHead className="py-2.5 px-3">Status</TableHead>
                      <TableHead className="py-2.5 px-3">Aadhaar Verified</TableHead>
                      <TableHead className="py-2.5 px-3">Requested On</TableHead>
                      <TableHead className="py-2.5 px-3 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kycList.map((row, i) => {
                      const id = row.id || row.roomTenantId || row.applicationId;
                      const status = (row.status || "pending").toLowerCase();
                      const isVerified = status === "completed" || status === "approved" || row.processing_done;
                      const canApprove = Boolean(
                        row.aadhaarNumber || row.digilockerVerified || row.documentUrl || row.kycDocument || row.address,
                      );

                      return (
                        <TableRow key={id || String(i)} className="text-xs hover:bg-[var(--gray-50)]">
                          <TableCell className="py-2.5 px-3">
                            <div className="font-medium text-[var(--gray-900)]">
                              {row.tenantName || row.name || row.tenant?.name || row.roomTenant?.tenant?.name || row.roomTenant?.name || "Tenant"}
                            </div>
                            <div className="text-xs text-[var(--gray-500)] tabular-nums">
                              {row.mobileNumber || row.phone || row.tenant?.phone || row.roomTenant?.tenant?.phone || row.roomTenant?.phone || "—"}
                            </div>
                          </TableCell>
                          <TableCell className="py-2.5 px-3 whitespace-nowrap">
                            {isVerified ? (
                              <StatusBadge label="Verified" tone="success" size="sm" />
                            ) : status === "rejected" ? (
                              <StatusBadge label="Rejected" tone="error" size="sm" />
                            ) : (
                              <StatusBadge label="Pending OTP" tone="warning" size="sm" />
                            )}
                          </TableCell>
                          <TableCell className="py-2.5 px-3">
                            {row.aadhaarNumber ? (
                              <span className="font-mono text-xs text-[var(--gray-700)]">
                                XXXX-XXXX-{row.aadhaarNumber.slice(-4)}
                              </span>
                            ) : isVerified ? (
                              <span className="text-xs text-[var(--success)] font-medium">
                                DigiLocker Matched
                              </span>
                            ) : (
                              <span className="text-xs text-[var(--gray-400)]">—</span>
                            )}
                          </TableCell>
                          <TableCell className="py-2.5 px-3 tabular-nums text-[var(--gray-600)] whitespace-nowrap">
                            {row.createdAt ? formatDate(row.createdAt) : "—"}
                          </TableCell>
                          <TableCell className="py-2.5 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs px-2 border-[var(--gray-300)]"
                                onClick={() => setDetailId(id)}
                              >
                                Details
                              </Button>
                              {!isVerified && (
                                <CanAccess permission="kyc_approve">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs px-2 text-[var(--success)] border-[#B4E5C5] hover:bg-[#ECFAF1]"
                                    disabled={!canApprove || approveMut.isPending}
                                    title={canApprove ? "Approve KYC" : "Waiting for Aadhaar details"}
                                    onClick={async () => {
                                      await approveMut.mutateAsync(id);
                                      toast({ title: "KYC Application Approved" });
                                      refetchKyc();
                                    }}
                                  >
                                    Approve
                                  </Button>
                                </CanAccess>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DIGITAL RENTAL AGREEMENTS */}
        {activeTab === "agreements" && (
          <FeatureGuard
            feature="digital_rental_agreements"
            fallbackTitle="Digital Rental Agreements & Aadhaar e-Sign (Pro Feature)"
            fallbackDescription="Draft legally valid rental agreements, send online Aadhaar e-Sign links, and automate tenant stamp papers exclusively on the Pro plan."
          >
            <div className="bg-white rounded-[16px] md:rounded-md border border-[var(--gray-200)] p-4 space-y-4">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Agreement status">
              {[
                ["all", "All"],
                ["draft", "Draft"],
                ["sent", "Sent"],
                ["signed", "Signed"],
                ["cancelled", "Cancelled"],
              ].map(([value, label]) => (
                <Button key={value} type="button" size="sm" variant={agreementStatus === value ? "default" : "outline"} onClick={() => setAgreementStatus(value)}>
                  {label}
                </Button>
              ))}
            </div>
            {isAgreementsLoading ? (
              <div className="flex justify-center py-16 text-sm text-[var(--gray-500)]">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-600)] mr-2" />
                Loading agreements...
              </div>
            ) : agreementsList.length === 0 ? (
              <EmptyState
                icon={<FileText className="h-10 w-10 text-[var(--gray-400)]" />}
                title="No rental agreements drafted yet"
                description="Draft legally valid rental agreements with online Aadhaar e-Sign."
                action={
                  <Button
                    size="sm"
                    className="bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white"
                    onClick={() => setCreateAgreementOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-1.5" /> Create agreement
                  </Button>
                }
              />
            ) : (
              <div className="overflow-x-auto rounded border border-[var(--gray-200)]">
                <Table>
                  <TableHeader className="bg-[var(--gray-100)] text-xs text-[var(--gray-600)]">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="py-2.5 px-3">Tenant & Room</TableHead>
                      <TableHead className="py-2.5 px-3">Rent & Deposit</TableHead>
                      <TableHead className="py-2.5 px-3">Terms</TableHead>
                      <TableHead className="py-2.5 px-3">Signing Status</TableHead>
                      <TableHead className="py-2.5 px-3 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agreementsList.map((ag) => {
                      const isSigned = ag.status === "signed";
                      return (
                        <TableRow key={ag.id} className="text-xs hover:bg-[var(--gray-50)]">
                          <TableCell className="py-2.5 px-3">
                            <div className="font-medium text-[var(--gray-900)]">{ag.tenantName}</div>
                            <div className="text-xs text-[var(--gray-500)]">
                              Room {ag.roomNumber} · {ag.tenantPhone}
                            </div>
                          </TableCell>
                          <TableCell className="py-2.5 px-3 whitespace-nowrap tabular-nums">
                            <div className="font-medium text-[var(--gray-900)]">
                              {formatINR(ag.monthlyRent)}/mo
                            </div>
                            <div className="text-xs text-[var(--gray-500)]">
                              Deposit: {formatINR(ag.securityDeposit)}
                            </div>
                          </TableCell>
                          <TableCell className="py-2.5 px-3 text-xs text-[var(--gray-600)] tabular-nums whitespace-nowrap">
                            <div>Notice: {ag.noticePeriodDays} days</div>
                            <div>Lock-in: {ag.lockInPeriodMonths} months</div>
                          </TableCell>
                          <TableCell className="py-2.5 px-3 whitespace-nowrap">
                            {isSigned ? (
                              <StatusBadge label="Signed" tone="success" size="sm" />
                            ) : ag.status === "sent_for_esign" ? (
                              <StatusBadge label="Sent for eSign" tone="info" size="sm" />
                            ) : (
                              <StatusBadge label="Draft" tone="neutral" size="sm" />
                            )}
                          </TableCell>
                          <TableCell className="py-2.5 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {ag.signingDirectUrl && !isSigned && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs px-2 border-[var(--gray-300)]"
                                  onClick={() => window.open(ag.signingDirectUrl, "_blank")}
                                >
                                  Sign link
                                </Button>
                              )}
                              {ag.signedPdfUrl || ag.agreementPdfUrl ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs px-2 border-[var(--gray-300)]"
                                  onClick={() => window.open(ag.signedPdfUrl || ag.agreementPdfUrl, "_blank")}
                                >
                                  <Download className="h-3.5 w-3.5 mr-1" /> PDF
                                </Button>
                              ) : null}
                              {!isSigned && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs px-2 border-[var(--gray-300)]"
                                  disabled={sendEsignMut.isPending}
                                  onClick={async () => {
                                    await sendEsignMut.mutateAsync(ag.id);
                                    toast({
                                      title: "eSign Link Resent",
                                      description: "Agreement signing link resent to tenant.",
                                    });
                                  }}
                                >
                                  Resend
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
          </FeatureGuard>
        )}

        {/* TAB 3: VERIFICATION CREDITS & PASSBOOK */}
        {activeTab === "credits" && (
          <div className="space-y-6">

            {/* KYC Top-up Plans */}
            <div className="bg-white rounded-[16px] md:rounded-lg border border-[var(--gray-200)] p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--gray-200)] pb-3">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--gray-900)] flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#2563EB]" />
                    KYC & Agreement Top-Up Plans
                  </h3>
                  <p className="text-xs text-[var(--gray-500)] mt-0.5">
                    Select a verification package to recharge your credits immediately via UPI or Cards.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {standardPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="rounded-xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-semibold text-slate-900 text-base sm:text-lg leading-snug">
                          {plan.name}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">{plan.description}</p>
                      </div>
                      <div className="text-right whitespace-nowrap">
                        {plan.originalPrice && (
                          <div className="text-xs sm:text-sm text-slate-400 line-through font-normal">
                            ₹{plan.originalPrice}
                          </div>
                        )}
                        <div className="text-xl sm:text-2xl font-bold text-slate-900">
                          ₹{plan.price}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                        <span className="text-base">🪙</span>
                        <span className="tabular-nums">{plan.coinLabel}</span>
                      </div>

                      <Button
                        onClick={() => handleBuyPlan(plan)}
                        disabled={topupOrderMut.isPending}
                        className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold px-5 sm:px-6 py-2 h-9 rounded-lg text-sm shadow-xs transition-colors"
                      >
                        {topupOrderMut.isPending ? "Processing..." : plan.actionLabel}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Transactions / Passbook Table */}
            <div className="bg-white rounded-[16px] md:rounded-md border border-[var(--gray-200)] p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--gray-200)] pb-3">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--gray-900)] flex items-center gap-2">
                    <History className="h-4 w-4 text-[var(--brand-600)]" />
                    Credit Passbook & Usage Statement
                  </h3>
                  <p className="text-xs text-[var(--gray-500)] mt-0.5">
                    Complete transaction ledger of credit grants, top-ups, and tenant KYC verifications.
                  </p>
                </div>
                <div className="text-xs text-[var(--gray-500)] font-medium">
                  {recentTransactions.length} recorded transaction{recentTransactions.length === 1 ? "" : "s"}
                </div>
              </div>

              {recentTransactions.length === 0 ? (
                <EmptyState
                  icon={<History className="h-10 w-10 text-[var(--gray-400)]" />}
                  title="No credit transactions yet"
                  description="Transactions will appear here when verification credits are granted, purchased, or consumed."
                />
              ) : (
                <div className="overflow-x-auto rounded border border-[var(--gray-200)]">
                  <Table>
                    <TableHeader className="bg-[var(--gray-100)] text-xs text-[var(--gray-600)]">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="py-2.5 px-3">Date & Time</TableHead>
                        <TableHead className="py-2.5 px-3">Type</TableHead>
                        <TableHead className="py-2.5 px-3">Description / Notes</TableHead>
                        <TableHead className="py-2.5 px-3">Reference</TableHead>
                        <TableHead className="py-2.5 px-3 text-right">Credits</TableHead>
                        <TableHead className="py-2.5 px-3 text-right">Balance After</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentTransactions.map((tx) => {
                        const isCredit = Number(tx.credits) > 0;
                        return (
                          <TableRow key={tx.id} className="text-xs hover:bg-[var(--gray-50)]">
                            <TableCell className="py-2.5 px-3 whitespace-nowrap text-[var(--gray-600)] tabular-nums">
                              {formatDateTime(tx.createdAt)}
                            </TableCell>
                            <TableCell className="py-2.5 px-3 whitespace-nowrap">
                              {getTransactionTypeBadge(tx.type)}
                            </TableCell>
                            <TableCell className="py-2.5 px-3 font-medium text-[var(--gray-900)]">
                              {tx.notes || (isCredit ? "Credits Added" : "Tenant Verification")}
                            </TableCell>
                            <TableCell className="py-2.5 px-3 whitespace-nowrap text-xs text-[var(--gray-600)]">
                              {(() => {
                                const kind = String(tx.referenceType || "").toLowerCase();
                                const labels: Record<string, string> = {
                                  tenant: "Tenant",
                                  kyc: "KYC",
                                  payment: "Payment",
                                  razorpay: "Razorpay",
                                  admin: "Admin",
                                  usage: "Verification",
                                };
                                const label = labels[kind] || (kind ? kind.replace(/_/g, " ") : "");
                                const shortId = tx.referenceId ? String(tx.referenceId).slice(0, 8) : "";
                                return [label, shortId].filter(Boolean).join(" · ") || "—";
                              })()}
                            </TableCell>
                            <TableCell className="py-2.5 px-3 text-right whitespace-nowrap tabular-nums">
                              {isCredit ? (
                                <span className="inline-flex items-center text-emerald-600 font-bold">
                                  <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" /> +{tx.credits}
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-slate-700 font-bold">
                                  <ArrowDownRight className="h-3.5 w-3.5 mr-0.5 text-slate-400" /> {tx.credits}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="py-2.5 px-3 text-right whitespace-nowrap tabular-nums font-semibold text-[var(--gray-900)]">
                              {tx.balanceAfter}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* DIALOG 1: CREDIT TOP-UP MODAL (RentOk KYC Credits Design) */}
        <Dialog open={topupOpen} onOpenChange={setTopupOpen}>
          <DialogContent className="max-w-md sm:max-w-lg p-6 sm:p-7 rounded-2xl border border-slate-200 bg-white space-y-4">
            <DialogHeader className="space-y-0 pb-1">
              <DialogTitle className="text-2xl font-bold text-slate-900 tracking-tight">
                KYC Credits
              </DialogTitle>
              <DialogDescription className="sr-only">
                Choose a plan for instant Aadhaar verification and digital rental agreements.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-1">
              {standardPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 hover:border-slate-300 transition-all space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-semibold text-slate-900 text-base sm:text-lg leading-snug">
                      {plan.name}
                    </span>
                    <div className="text-right whitespace-nowrap">
                      {plan.originalPrice && (
                        <div className="text-xs sm:text-sm text-slate-400 line-through font-normal">
                          ₹{plan.originalPrice}
                        </div>
                      )}
                      <div className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight">
                        ₹{plan.price}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#EAB308] border border-[#CA8A04] flex items-center justify-center text-white text-[11px] font-bold leading-none shadow-xs select-none">
                        ₹
                      </div>
                      <span className="text-sm font-medium text-slate-800 tabular-nums">
                        {plan.coinLabel}
                      </span>
                    </div>

                    {plan.buttonVariant === "outline" ? (
                      <Button
                        variant="outline"
                        onClick={() => handleBuyPlan(plan)}
                        disabled={topupOrderMut.isPending}
                        className="border-2 border-[#2563EB] text-[#2563EB] hover:bg-blue-50/60 font-semibold px-6 py-2 h-9 rounded-lg text-sm shadow-xs transition-colors"
                      >
                        {topupOrderMut.isPending ? "Processing..." : plan.actionLabel}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleBuyPlan(plan)}
                        disabled={topupOrderMut.isPending}
                        className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold px-6 py-2 h-9 rounded-lg text-sm shadow-xs transition-colors"
                      >
                        {topupOrderMut.isPending ? "Processing..." : plan.actionLabel}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Gateway Selector */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-xs font-semibold text-slate-800 mb-2">Select Payment Gateway:</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedGateway("easebuzz")}
                  className={`p-2 rounded-lg border text-left flex items-center justify-between text-xs font-semibold transition cursor-pointer ${
                    selectedGateway === "easebuzz"
                      ? "border-[#008080] bg-teal-50/60 text-[#008080] ring-1 ring-[#008080]"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#008080]"></span>
                    <span>Easebuzz</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-normal">Fast UPI / Card</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedGateway("razorpay")}
                  className={`p-2 rounded-lg border text-left flex items-center justify-between text-xs font-semibold transition cursor-pointer ${
                    selectedGateway === "razorpay"
                      ? "border-blue-600 bg-blue-50 text-blue-800 ring-1 ring-blue-600"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    <span>Razorpay</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-normal">All Options</span>
                </button>
              </div>
            </div>

            {otherCreditPacks.length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Bulk Quota Packages
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {otherCreditPacks.map((pack: any) => (
                    <div
                      key={pack.id}
                      className="rounded-lg border border-slate-200 p-2.5 flex items-center justify-between bg-slate-50/50"
                    >
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{pack.name}</p>
                        <p className="text-[11px] text-slate-500">{pack.credits} Credits · ₹{pack.price}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTopupCheckout(pack.id)}
                        disabled={topupOrderMut.isPending}
                        className="h-7 text-xs font-semibold text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        Buy
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* DIALOG 2: REQUEST TENANT KYC MODAL */}
        <Dialog open={requestKycOpen} onOpenChange={setRequestKycOpen}>
          <DialogContent className="max-w-md p-6 space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold text-[var(--gray-900)]">
                Request Tenant KYC
              </DialogTitle>
              <DialogDescription className="text-xs text-[var(--gray-500)]">
                Select a tenant to send a DigiLocker Aadhaar verification link via WhatsApp. Consumes 1 credit.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[var(--gray-700)]">
                  Select Tenant <span className="text-[#B42318]">*</span>
                </Label>
                <Select value={selectedTenantForKyc} onValueChange={setSelectedTenantForKyc}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Choose resident..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tenantsData.map((t: any) => {
                      const tid = t.roomTenantId || t.id;
                      return (
                        <SelectItem key={tid} value={tid} className="text-sm">
                          {t.name || t.tenantName} (Room {t.roomNumber || t.roomNo || "—"}) · {t.mobileNumber || t.phone}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRequestKycOpen(false)}
                className="border-[var(--gray-300)]"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white font-medium"
                disabled={!selectedTenantForKyc || requestKycMut.isPending}
                onClick={handleInitiateTenantKyc}
              >
                {requestKycMut.isPending ? "Sending..." : "Send KYC Request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DIALOG 3: CREATE DIGITAL AGREEMENT MODAL */}
        <Dialog open={createAgreementOpen} onOpenChange={setCreateAgreementOpen}>
          <DialogContent className="max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold text-[var(--gray-900)]">
                Create Digital Rental Agreement
              </DialogTitle>
              <DialogDescription className="text-xs text-[var(--gray-500)]">
                Draft a legally compliant rental agreement and dispatch for DigiLocker Aadhaar e-Sign.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[var(--gray-700)]">
                  Select Tenant <span className="text-[#B42318]">*</span>
                </Label>
                <Select
                  value={agreementForm.roomTenantId}
                  onValueChange={(val) => setAgreementForm({ ...agreementForm, roomTenantId: val })}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Choose resident..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tenantsData.map((t: any) => {
                      const tid = t.roomTenantId || t.id;
                      return (
                        <SelectItem key={tid} value={tid} className="text-sm">
                          {t.name || t.tenantName} (Room {t.roomNumber || t.roomNo || "—"})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[var(--gray-700)]">Monthly Rent (₹)</Label>
                  <Input
                    type="number"
                    value={agreementForm.monthlyRent}
                    onChange={(e) => setAgreementForm({ ...agreementForm, monthlyRent: Number(e.target.value) })}
                    className="h-9 text-sm tabular-nums"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[var(--gray-700)]">Security Deposit (₹)</Label>
                  <Input
                    type="number"
                    value={agreementForm.securityDeposit}
                    onChange={(e) => setAgreementForm({ ...agreementForm, securityDeposit: Number(e.target.value) })}
                    className="h-9 text-sm tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[var(--gray-700)]">Notice Period (Days)</Label>
                  <Input
                    type="number"
                    value={agreementForm.noticePeriodDays}
                    onChange={(e) => setAgreementForm({ ...agreementForm, noticePeriodDays: Number(e.target.value) })}
                    className="h-9 text-sm tabular-nums"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[var(--gray-700)]">Lock-in Period (Months)</Label>
                  <Input
                    type="number"
                    value={agreementForm.lockInPeriodMonths}
                    onChange={(e) => setAgreementForm({ ...agreementForm, lockInPeriodMonths: Number(e.target.value) })}
                    className="h-9 text-sm tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[var(--gray-700)]">Start Date</Label>
                  <Input
                    type="date"
                    value={agreementForm.agreementStartDate}
                    onChange={(e) => setAgreementForm({ ...agreementForm, agreementStartDate: e.target.value })}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[var(--gray-700)]">End Date (optional)</Label>
                  <Input
                    type="date"
                    value={agreementForm.agreementEndDate}
                    onChange={(e) => setAgreementForm({ ...agreementForm, agreementEndDate: e.target.value })}
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[var(--gray-700)]">House Rules & Terms</Label>
                <Textarea
                  rows={3}
                  value={agreementForm.houseRules}
                  onChange={(e) => setAgreementForm({ ...agreementForm, houseRules: e.target.value })}
                  className="text-sm"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreateAgreementOpen(false)}
                className="border-[var(--gray-300)]"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white font-medium"
                disabled={!agreementForm.roomTenantId || createAgreementMut.isPending}
                onClick={handleCreateAgreement}
              >
                {createAgreementMut.isPending ? "Generating..." : "Generate Agreement"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DIALOG 4: VIEW KYC DETAILS MODAL */}
        <Dialog open={Boolean(detailId)} onOpenChange={(o) => !o && setDetailId(null)}>
          <DialogContent className="max-w-md p-6 space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold text-[var(--gray-900)]">
                Aadhaar Verification Details
              </DialogTitle>
            </DialogHeader>
            {detailQuery.isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-600)]" />
              </div>
            ) : detailQuery.data ? (
              <div className="space-y-3 py-2 text-sm">
                <div className="grid grid-cols-2 gap-3 bg-[var(--gray-50)] p-3 rounded-md border border-[var(--gray-200)]">
                  <div>
                    <span className="text-[11px] text-[var(--gray-500)] block">Full Name</span>
                    <p className="font-semibold text-sm text-[var(--gray-900)]">{kycDetail.name || "—"}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-[var(--gray-500)] block">Gender / DOB</span>
                    <p className="font-semibold text-sm text-[var(--gray-900)]">{kycDetail.gender || "—"} · {kycDetail.dob || "—"}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[11px] text-[var(--gray-500)] block">Permanent Address</span>
                    <p className="text-xs text-[var(--gray-700)] mt-0.5 leading-relaxed">{kycDetail.address || "—"}</p>
                  </div>
                </div>

                {kycDetail?.name || kycDetail?.address || kycDetail?.dob || kycDetail?.aadhaarNumber ? (
                  <div className="flex items-center gap-2 text-xs text-[var(--success)] font-medium pt-1">
                    <CheckCircle2 className="h-4 w-4" /> Authenticated directly via UIDAI DigiLocker Gateway
                  </div>
                ) : (
                  <p className="text-xs text-[var(--gray-600)] pt-1">
                    Waiting for the tenant to finish DigiLocker. No Aadhaar details yet.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-[var(--gray-500)] text-center py-4">No data available.</p>
            )}
          </DialogContent>
        </Dialog>

        <TrialExpiredGateModal
          open={trialExpiredOpen}
          onOpenChange={setTrialExpiredOpen}
          featureName={trialExpiredFeature}
        />
      </div>
    </CanAccessPage>
  );
}
