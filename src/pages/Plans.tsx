import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  Zap,
  Loader2,
  Lock,
  Phone,
  MessageCircle,
  AlertTriangle,
  Minus,
  Plus,
  Building2,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Headphones,
  Gift,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import {
  useMyFeaturesQuery,
  usePlansList,
  useCurrentPlan,
  useCreatePlanCheckoutOrderMutation,
  useVerifyPlanPaymentMutation,
  useAllRoomsAndCounts,
} from "@/hooks/usePropertyOwnerQueries";
import { buildFeatureKeySet, userHasFeatureForRow, type PlanTierKey } from "@/lib/planFeatures";
import { useSubscriptionAccess } from "@/hooks/useSubscriptionAccess";
import { useApp } from "@/context/AppContext";
import { toast } from "@/components/ui/use-toast";
import { formatINR } from "@/lib/formatters";
import { getPaymentSettings, updatePaymentSettings } from "@/api/propertyOwner";
import { SUPPORT_PHONE_DISPLAY, SUPPORT_PHONE_TEL, supportWhatsAppUrl } from "@/config/links";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

interface ComparisonFeature {
  name: string;
  category: "Collections & Payments" | "Automation & Tenant Experience" | "Operations & Legal" | "Support & Infrastructure";
  featureKey: string;
  free: boolean;
  lite: boolean;
  pro: boolean;
  description: string;
}

const COMPARISON_FEATURES: ComparisonFeature[] = [
  // Collections & Payments
  {
    category: "Collections & Payments",
    name: "Direct UPI & QR Intent (0% Gateway Fee)",
    featureKey: "direct_upi_intent",
    free: false,
    lite: true,
    pro: true,
    description: "Collect directly into your bank account via dynamic QR with zero transaction fees.",
  },
  {
    category: "Collections & Payments",
    name: "Manual Payment Verification Queue",
    featureKey: "manual_payment_verify",
    free: false,
    lite: true,
    pro: true,
    description: "Inline review of UTR numbers and payment screenshots with 1-click Approve/Reject.",
  },
  {
    category: "Collections & Payments",
    name: "Automated Payment Gateway (Cards/NetBanking/AutoPay)",
    featureKey: "automated_payment_gateway",
    free: false,
    lite: false,
    pro: true,
    description: "Full gateway checkout with credit/debit cards, net banking, and automatic dues reconciliation.",
  },
  {
    category: "Collections & Payments",
    name: "Automated Bank Settlement (T+2 Days)",
    featureKey: "automated_settlement",
    free: false,
    lite: false,
    pro: true,
    description: "Direct scheduled payouts into your registered property bank account.",
  },

  // Automation & Tenant Experience
  {
    category: "Automation & Tenant Experience",
    name: "Automated WhatsApp Payment Reminders & Receipts",
    featureKey: "WHATSAPP_AUTOMATION",
    free: false,
    lite: false,
    pro: true,
    description: "Automated WhatsApp notifications for pending dues, rent slips, and announcements.",
  },
  {
    category: "Automation & Tenant Experience",
    name: "Dedicated PG Subdomain Website ({pgname}.pgease.in)",
    featureKey: "pg_subdomain_website",
    free: false,
    lite: true,
    pro: true,
    description: "Public SEO-ready web page showcasing your PG amenities, room photos, and live vacant beds.",
  },
  {
    category: "Automation & Tenant Experience",
    name: "Private PG Group Chat (Owner + Staff + Tenants)",
    featureKey: "pg_group_chat",
    free: false,
    lite: false,
    pro: true,
    description: "Official internal messaging channel for property announcements and tenant discussions.",
  },

  // Operations & Legal
  {
    category: "Operations & Legal",
    name: "Unlimited Rooms, Floors & Bed Allocation Grid",
    featureKey: "ROOM_STRUCTURE",
    free: true,
    lite: true,
    pro: true,
    description: "Visual floor plan and room matrix with real-time occupancy and sharing type tracking.",
  },
  {
    category: "Operations & Legal",
    name: "DigiLocker Aadhaar KYC Verification",
    featureKey: "KYC_VERIFICATION",
    free: true,
    lite: true,
    pro: true,
    description: "Instant government-verified tenant Aadhaar identity checks via DigiLocker.",
  },
  {
    category: "Operations & Legal",
    name: "Digital Rental Agreement with eSign",
    featureKey: "RENTAL_AGREEMENT",
    free: false,
    lite: false,
    pro: true,
    description: "Legally compliant digital lease agreements with Aadhaar-backed digital signatures.",
  },
  {
    category: "Operations & Legal",
    name: "Notice Period Tracking & Bed Vacancy Timeline",
    featureKey: "notice_period_tracker",
    free: false,
    lite: false,
    pro: true,
    description: "Countdown timers for vacating tenants to pre-book and reallocate beds in advance.",
  },
  {
    category: "Operations & Legal",
    name: "Complaints & Maintenance Ticket Desk",
    featureKey: "COMPLAINTS_DESK",
    free: true,
    lite: true,
    pro: true,
    description: "Track electrical, plumbing, and housekeeping tickets with staff resolution remarks.",
  },

  // Support & Infrastructure
  {
    category: "Support & Infrastructure",
    name: "Dedicated Account Manager (Phone & WhatsApp)",
    featureKey: "dedicated_account_manager",
    free: false,
    lite: true,
    pro: true,
    description: "Personal operations specialist assigned to assist you with room setup and training.",
  },
  {
    category: "Support & Infrastructure",
    name: "Live Occupancy & 95-Column Excel Financial Exports",
    featureKey: "ADVANCED_ANALYTICS",
    free: false,
    lite: true,
    pro: true,
    description: "Comprehensive tenant registers, paid audit logs, and unpaid balance downloads.",
  },
];

const FAQS = [
  {
    q: "How does the 45-day Pro Trial work?",
    a: "New owners start on a trial of PG Ease Pro. When it ends, your data stays visible. Renew PG Ease Pro monthly or yearly to restore full access. Tenants are never charged for the app.",
  },
  {
    q: "How do tenants pay rent?",
    a: "You choose once for your PG: Manual UPI (tenant pays your UPI and submits a UTR or screenshot, you approve) at ₹0 fee, or an automatic payment gateway after Easebuzz KYC is Active. The gateway fee is deducted from your settlement. Tenants never pay extra.",
  },
  {
    q: "What is included in PG Ease Pro?",
    a: "Unlimited tenants, rooms and beds, rent tracking, complaints, expenses, your PG website, and WhatsApp notifications. Aadhaar KYC and rent e-agreements are paid add-ons using credits.",
  },
  {
    q: "Can I adjust my bed capacity later?",
    a: "Yes! Your subscription is charged per bed based on your property inventory. You can increase or decrease your bed quota anytime as your PG expands or contracts.",
  },
];

export default function Plans() {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [payMode, setPayMode] = useState<"MANUAL" | "GATEWAY">("MANUAL");
  const [upiId, setUpiId] = useState("");
  const [kycStatus, setKycStatus] = useState("Pending");
  const [savingPay, setSavingPay] = useState(false);
  const [showMatrix, setShowMatrix] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const { data: featuresData } = useMyFeaturesQuery();
  const { data: plansData } = usePlansList();
  const { data: currentPlanData, refetch: refetchCurrentPlan } = useCurrentPlan();
  const subAccess = useSubscriptionAccess();
  const { selectedPgId, properties } = useApp();

  const selectedPg = useMemo(
    () => properties.find((p) => p.id === selectedPgId),
    [properties, selectedPgId]
  );

  // Auto-detect beds from active inventory
  const roomsQuery = useAllRoomsAndCounts(selectedPgId);
  const detectedBeds = useMemo(() => {
    const rooms = roomsQuery.data ?? [];
    return rooms.reduce((sum, r) => sum + (r.totalBeds ?? 0), 0);
  }, [roomsQuery.data]);

  // Selected bed capacity for checkout (min 10)
  const [selectedBeds, setSelectedBeds] = useState<number>(() => Math.max(10, detectedBeds || 25));

  // Sync detected beds once loaded
  useEffect(() => {
    if (detectedBeds > 0) {
      setSelectedBeds((prev) => (prev === 25 ? Math.max(10, detectedBeds) : prev));
    }
  }, [detectedBeds]);

  useEffect(() => {
    getPaymentSettings()
      .then((settings) => {
        setPayMode(settings.paymentMode === "GATEWAY" ? "GATEWAY" : "MANUAL");
        setUpiId(settings.upiId || "");
        setKycStatus(settings.kycStatus || "Pending");
      })
      .catch(() => {});
  }, []);

  const savePaymentMode = async (next: "MANUAL" | "GATEWAY") => {
    const ok = window.confirm(
      next === "GATEWAY"
        ? "Switch this PG to automatic gateway collection? Manual UPI stays available until Easebuzz KYC is Active."
        : "Switch this PG to manual UPI collection?",
    );
    if (!ok) return;
    setSavingPay(true);
    try {
      const saved = await updatePaymentSettings({ paymentMode: next, upiId });
      setPayMode(saved.paymentMode);
      toast({ title: "Payment method updated" });
    } catch (err: any) {
      toast({ title: "Could not update payment method", description: err?.message, variant: "destructive" });
    } finally {
      setSavingPay(false);
    }
  };

  const createOrderMut = useCreatePlanCheckoutOrderMutation();
  const verifyPaymentMut = useVerifyPlanPaymentMutation();

  const rawPlanName = featuresData?.planName || currentPlanData?.currentPlan?.name || "Lite";
  const currentPlanKey: PlanTierKey = rawPlanName.toLowerCase().includes("pro") ? "PRO" : "LITE";

  const apiFeatureKeys = buildFeatureKeySet(featuresData?.features);
  const hasExplicitApiList = Boolean(featuresData?.features && featuresData.features.length > 0);

  const STATIC_CATALOG = {
    name: "PG Ease Pro",
    gstPercent: 18,
    offer: { enabled: true, badge: "🪔 Diwali Offer – Grab it soon!" },
    features: [
      "Unlimited tenants, rooms, beds",
      "Rent tracking, dues, auto receipts",
      "Payment collection: Manual UPI OR Automatic payment gateway",
      "Complaints & tenant app",
      "Expenses & reports",
      "PG website (pgname.pgease.com)",
      "WhatsApp notifications (free)",
      "Paid add-ons (credits): Aadhaar KYC, rent e-agreement",
    ],
    cycles: [
      { cycle: "monthly" as const, pricePerBed: 29, strikePerBed: 49, period: "per bed / month" },
      { cycle: "yearly" as const, pricePerBed: 290, strikePerBed: 490, period: "per bed / year", note: "2 months free" },
    ],
  };
  const catalog = plansData?.catalog?.cycles?.length ? plansData.catalog : STATIC_CATALOG;
  const cycleKey = billingCycle === "annual" ? "yearly" : "monthly";
  const selectedCycle = catalog?.cycles?.find((c) => c.cycle === cycleKey) || catalog?.cycles?.[0];
  const unitRate = selectedCycle?.pricePerBed ?? 0;
  const subtotal = unitRate * selectedBeds;
  const gstPercent = catalog?.gstPercent ?? 0;
  const gstAmount = Math.round(subtotal * gstPercent) / 100;
  const proTotal = Math.round((subtotal + gstAmount) * 100) / 100;

  const isCurrentLite = currentPlanKey === "LITE" && !subAccess.isTrial && !subAccess.isExpired;

  const handleUpgradeCheckout = async (planKey: "LITE" | "PRO") => {
    try {
      const planId = planKey === "PRO" ? "pro" : "lite";
      const order = await createOrderMut.mutateAsync({
        planId,
        billingCycle,
        numberOfBeds: selectedBeds,
      });

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
        description: `${planKey} Plan (${selectedBeds} beds, ${billingCycle})`,
        order_id: order.orderId,
        handler: async (response: any) => {
          try {
            await verifyPaymentMut.mutateAsync({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              planId,
              billingCycle,
              numberOfBeds: selectedBeds,
            });
            toast({
              title: "Subscription Activated! 👑",
              description: `Your account has been upgraded to ${planKey} Plan for ${selectedBeds} beds.`,
            });
            refetchCurrentPlan();
          } catch (err: any) {
            toast({
              title: "Payment Verification Failed",
              description: err?.message || "Please contact support if amount was debited.",
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
        title: "Could not initiate checkout",
        description: err?.message || "Please try again or contact your dedicated account manager.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-6xl mx-auto">
      {/* ================= PAGE HEADER & STATUS ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E6EA] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#18212B]">
              Plans & Subscription
            </h1>
            {subAccess.isTrial ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[4px] bg-[#FFF7E6] border border-[#F5D9A8] text-[#A15C07] text-[11px] font-semibold">
                <Clock className="h-3 w-3 text-[#E08A00]" />
                45-Day Pro Trial Active ({subAccess.trialDaysRemaining} days remaining)
              </span>
            ) : subAccess.isExpired ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[4px] bg-[#FEF1F0] border border-[#F6C7C2] text-[#B42318] text-[11px] font-semibold">
                <AlertTriangle className="h-3 w-3 text-[#D92D20]" />
                Trial Concluded · Read-Only Mode
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[4px] bg-[#ECFAF1] border border-[#B4E5C5] text-[#157F3D] text-[11px] font-semibold">
                <CheckCircle2 className="h-3 w-3 text-[#22A350]" />
                {subAccess.planDisplayName} (Paid Active)
              </span>
            )}
          </div>
          <p className="text-[13px] text-[#556270] mt-1">
            Simple per-bed pricing tailored for Indian PG and hostel owners. No hidden fees.
          </p>
        </div>

        {/* Support Hotline Capsule */}
        <div className="flex items-center gap-2 bg-white border border-[#E2E6EA] rounded-[6px] px-3 py-2 shadow-2xs shrink-0">
          <Headphones className="h-4 w-4 text-[#008080]" />
          <div className="text-left">
            <div className="text-[10px] uppercase font-bold text-[#6B7785] tracking-wider">
              Account Manager
            </div>
            <a
              href={SUPPORT_PHONE_TEL}
              className="text-[12px] font-bold text-[#18212B] hover:text-[#008080] transition-colors tabular-nums"
            >
              {SUPPORT_PHONE_DISPLAY}
            </a>
          </div>
        </div>
      </div>

      {/* ================= EXPIRED NOTICE BANNER ================= */}
      {subAccess.isExpired && (
        <div className="rounded-[8px] border border-[#F6C7C2] bg-[#FEF1F0] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-[6px] bg-[#D92D20]/10 border border-[#D92D20]/20 flex items-center justify-center text-[#D92D20] shrink-0 mt-0.5">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-[14px] font-bold text-[#B42318]">
                Trial Concluded — Operations Currently Restricted
              </h4>
              <p className="text-[12px] text-[#7A1E14] max-w-2xl leading-relaxed">
                Your trial has ended. Your data stays visible in read-only mode, and tenants can still pay. Renew PG Ease Pro below to restore full access. Gateway collections fall back to your UPI until you renew.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <a
              href={SUPPORT_PHONE_TEL}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-[#C8CFD6] bg-white text-[12px] font-semibold text-[#18212B] hover:bg-[#F6F7F8]"
            >
              <Phone className="h-3.5 w-3.5 text-[#008080]" /> Call
            </a>
            <a
              href={supportWhatsAppUrl("Hi, my PG Ease trial has expired and I want to activate my plan.")}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-[6px] bg-[#157F3D] hover:bg-[#116932] text-white text-[12px] font-semibold shadow-xs"
            >
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
            </a>
          </div>
        </div>
      )}

      {/* ================= COMPACT BED CAPACITY & BILLING TOOLSTRIP ================= */}
      <div className="bg-white border border-[#E2E6EA] rounded-[8px] p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Bed Quota Selector */}
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-bold text-[#18212B] flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-[#008080]" />
                Select Total Bed Capacity
              </label>
              {detectedBeds > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedBeds(Math.max(10, detectedBeds))}
                  className="text-[11px] font-semibold text-[#008080] hover:underline inline-flex items-center gap-1"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Detected {detectedBeds} beds in {selectedPg?.name || "your PG"} (Click to apply)
                </button>
              )}
            </div>

            {/* Stepper + Quick Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <div className="flex items-center border border-[#C8CFD6] rounded-[6px] bg-white h-[36px] overflow-hidden">
                <button
                  type="button"
                  disabled={selectedBeds <= 10}
                  onClick={() => setSelectedBeds((b) => Math.max(10, b - 5))}
                  className="w-8 h-full flex items-center justify-center text-[#556270] hover:bg-[#F6F7F8] disabled:opacity-30 disabled:cursor-not-allowed border-r border-[#E2E6EA]"
                  aria-label="Decrease beds"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <div className="px-3 min-w-[70px] text-center font-bold text-[14px] text-[#18212B] tabular-nums select-none">
                  {selectedBeds} beds
                </div>
                <button
                  type="button"
                  disabled={selectedBeds >= 1000}
                  onClick={() => setSelectedBeds((b) => Math.min(1000, b + 5))}
                  className="w-8 h-full flex items-center justify-center text-[#556270] hover:bg-[#F6F7F8] disabled:opacity-30 disabled:cursor-not-allowed border-l border-[#E2E6EA]"
                  aria-label="Increase beds"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Fast Presets */}
              {[15, 25, 50, 100, 200, 350].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setSelectedBeds(preset)}
                  className={`h-[36px] px-3 rounded-[6px] text-[12px] font-semibold transition-all border ${
                    selectedBeds === preset
                      ? "bg-[#008080] text-white border-[#008080] shadow-2xs"
                      : "bg-[#F6F7F8] text-[#556270] border-[#E2E6EA] hover:border-[#C8CFD6] hover:bg-white"
                  }`}
                >
                  {preset} Beds
                </button>
              ))}
            </div>
          </div>

          {/* Billing Cycle Toggle */}
          <div className="space-y-1.5 shrink-0 border-t md:border-t-0 md:border-l border-[#E2E6EA] md:pl-5 pt-3 md:pt-0">
            <label className="text-[12px] font-bold text-[#18212B] block">
              Billing Interval
            </label>
            <div className="inline-flex items-center bg-[#EEF1F3] p-0.5 rounded-[6px] border border-[#E2E6EA] h-[36px] select-none">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`px-3.5 h-full rounded-[4px] text-[12px] font-semibold transition-all ${
                  billingCycle === "monthly"
                    ? "bg-white text-[#18212B] shadow-2xs"
                    : "text-[#556270] hover:text-[#18212B]"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("annual")}
                className={`px-3.5 h-full rounded-[4px] text-[12px] font-semibold transition-all inline-flex items-center gap-1.5 ${
                  billingCycle === "annual"
                    ? "bg-white text-[#18212B] shadow-2xs"
                    : "text-[#556270] hover:text-[#18212B]"
                }`}
              >
                <span>Yearly</span>
                <span className="rounded bg-[#ECFAF1] text-[#157F3D] px-1.5 py-0.2 text-[9px] font-bold border border-[#B4E5C5]">
                  2 months free
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= PG EASE PRO ================= */}
      {catalog?.offer?.badge && (
        <div className="inline-flex rounded-[4px] bg-[#FFF7E6] border border-[#F5D9A8] text-[#A15C07] text-[12px] font-semibold px-3 py-1">
          {catalog.offer.badge}
        </div>
      )}
      <div className="max-w-xl">
        {/* CARD 1: LITE PLAN (₹29/BED) */}
        <div
          className={`rounded-[10px] bg-white border transition-all flex flex-col justify-between p-6 sm:p-7 relative shadow-xs ${
            isCurrentLite
              ? "border-[#008080] ring-1 ring-[#008080]/30"
              : "border-[#E2E6EA] hover:border-[#C8CFD6]"
          }`}
        >
          {isCurrentLite && (
            <div className="absolute -top-3 right-4">
              <span className="bg-[#E8F4F4] text-[#008080] border border-[#008080]/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Current Plan
              </span>
            </div>
          )}

          <div className="space-y-4">
            {/* Header */}
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-[6px] bg-[#FFF7E6] border border-[#F5D9A8] flex items-center justify-center text-[#A15C07]">
                    <Zap className="h-4 w-4 text-[#E08A00]" />
                  </div>
                  <div>
                    <h3 className="text-[18px] font-bold text-[#18212B]">{catalog?.name || "PG Ease Pro"}</h3>
                    <p className="text-[11px] text-[#556270]">Per bed, plus {gstPercent}% GST</p>
                  </div>
                </div>
                <span className="text-[12px] font-bold text-[#556270] bg-[#F6F7F8] px-2.5 py-1 rounded-[4px] border border-[#E2E6EA]">
                  {selectedCycle?.strikePerBed != null && (
                    <span className="line-through text-[#98A2AE] mr-1">₹{selectedCycle.strikePerBed}</span>
                  )}
                  ₹{unitRate || "—"} / bed
                </span>
              </div>
            </div>

            {/* Total Dynamic Price */}
            <div className="pt-2 border-t border-[#EEF1F3]">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-[#18212B] tabular-nums tracking-tight">
                  {selectedCycle ? formatINR(proTotal) : "—"}
                </span>
                <span className="text-[12px] text-[#556270] font-medium">
                  / {billingCycle === "annual" ? "year" : "month"}
                </span>
              </div>
              <p className="text-[11px] text-[#6B7785] mt-0.5 tabular-nums">
                {selectedBeds} beds × ₹{unitRate} = {formatINR(subtotal)} + GST {formatINR(gstAmount)}
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-2.5 pt-3 border-t border-[#EEF1F3]">
              <div className="text-[11px] uppercase font-bold text-[#6B7785] tracking-wider">
                Included:
              </div>
              {(catalog?.features || []).map((feature) => (
                <div key={feature} className="flex items-start gap-2.5 text-[12px] text-[#3D4A57]">
                  <Check className="h-4 w-4 text-[#157F3D] shrink-0 mt-0.5" />
                  <span className="leading-snug">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action CTA */}
          <div className="pt-6 mt-6 border-t border-[#EEF1F3]">
            <button
              type="button"
              disabled={!selectedCycle || createOrderMut.isPending}
              onClick={() => handleUpgradeCheckout("PRO")}
              className="w-full h-[44px] rounded-[6px] font-semibold text-[13px] transition-all flex items-center justify-center gap-2 bg-[#008080] hover:bg-[#006B6B] text-white disabled:opacity-50"
            >
              {createOrderMut.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                <>
                  <span>Buy PG Ease Pro ({selectedCycle ? formatINR(proTotal) : "—"})</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      <div className="rounded-[8px] border border-[#E2E6EA] bg-white p-5 space-y-3 max-w-xl">
        <h3 className="text-[15px] font-bold text-[#18212B]">How tenants pay you</h3>
        <p className="text-[12px] text-[#556270]">
          This stays on the account. Gateway fee is taken from your settlement. Tenants are not charged extra.
          {kycStatus.toLowerCase() !== "active" && payMode === "GATEWAY" ? " KYC is not Active, so manual UPI stays the fallback." : ""}
        </p>
        <div className="flex gap-2">
          <button type="button" disabled={savingPay} onClick={() => savePaymentMode("MANUAL")} className={`px-3 py-2 rounded-[6px] text-[12px] font-semibold border ${payMode === "MANUAL" ? "bg-[#008080] text-white border-[#008080]" : "bg-white border-[#C8CFD6]"}`}>Manual UPI · ₹0</button>
          <button type="button" disabled={savingPay} onClick={() => savePaymentMode("GATEWAY")} className={`px-3 py-2 rounded-[6px] text-[12px] font-semibold border ${payMode === "GATEWAY" ? "bg-[#008080] text-white border-[#008080]" : "bg-white border-[#C8CFD6]"}`}>Payment gateway</button>
        </div>
        <label className="block text-[12px] text-[#556270]">
          Owner UPI ID
          <input value={upiId} onChange={(e) => setUpiId(e.target.value)} className="mt-1 w-full h-9 rounded-[6px] border border-[#C8CFD6] px-2 text-[#18212B]" placeholder="name@upi" />
        </label>
        <p className="text-[12px] text-[#556270]">Easebuzz KYC: {kycStatus}</p>
      </div>

      {/* ================= REFERRAL CASHBACK CALLOUT ================= */}
      <div className="rounded-[8px] border border-[#BFD6F6] bg-[#EEF5FF] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-[6px] bg-[#1D5FC2]/10 border border-[#1D5FC2]/20 flex items-center justify-center text-[#1D5FC2] shrink-0">
            <Gift className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold text-[#18212B]">
                Offset Your Software Cost — Earn ₹1,000 per PG Referral
              </span>
              <span className="bg-[#1D5FC2]/10 text-[#1D5FC2] text-[10px] font-bold px-2 py-0.2 rounded border border-[#1D5FC2]/20">
                Direct Bank Transfer
              </span>
            </div>
            <p className="text-[12px] text-[#556270] mt-0.5">
              Know other PG or hostel owners? Invite them to PG Ease. When they subscribe, earn cash directly in your bank account.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate("/referrals")}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-white border border-[#C8CFD6] text-[12px] font-semibold text-[#18212B] hover:bg-[#F6F7F8]"
        >
          <span>Invite Owners</span>
          <ArrowRight className="h-3 w-3 text-[#008080]" />
        </button>
      </div>

      {/* ================= FEATURE COMPARISON MATRIX (ACCORDION) ================= */}
      <div className="bg-white border border-[#E2E6EA] rounded-[8px] overflow-hidden shadow-2xs">
        <button
          type="button"
          onClick={() => setShowMatrix(!showMatrix)}
          className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-[#F6F7F8] transition-colors"
        >
          <div>
            <h3 className="text-[15px] font-bold text-[#18212B] flex items-center gap-2">
              <span>Full Feature Comparison Matrix</span>
              <span className="text-[11px] font-normal text-[#6B7785]">
                (Compare all 14 operational modules)
              </span>
            </h3>
            <p className="text-[12px] text-[#556270] mt-0.5">
              Everything in PG Ease Pro. Tenants, rooms, and beds are unlimited.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[12px] font-semibold text-[#008080]">
            <span>{showMatrix ? "Hide Matrix" : "View Full Comparison"}</span>
            {showMatrix ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </button>

        {showMatrix && (
          <div className="border-t border-[#E2E6EA] overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="border-b border-[#E2E6EA] bg-[#F6F7F8] text-[#556270]">
                  <th className="py-3 px-4 font-bold min-w-[260px]">Feature & Operational Capability</th>
                  <th className="py-3 px-4 font-bold text-center w-[160px] text-[#008080]">PG Ease Pro</th>
                  <th className="py-3 px-4 font-bold text-center w-[140px] bg-[#E8F4F4]/50 text-[#008080]">
                    Your Plan
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E6EA]">
                {COMPARISON_FEATURES.map((feat, idx) => {
                  const youHave = userHasFeatureForRow(
                    feat,
                    apiFeatureKeys,
                    hasExplicitApiList,
                    currentPlanKey
                  );
                  return (
                    <tr key={idx} className="hover:bg-[#F6F7F8]/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#18212B]">{feat.name}</div>
                        <div className="text-[11px] text-[#6B7785] mt-0.5">{feat.description}</div>
                      </td>
                      <td className="py-3 px-4 text-center bg-[#E8F4F4]/20">
                        <Check className="h-4 w-4 text-[#008080] mx-auto stroke-[2.5]" />
                      </td>
                      <td className="py-3 px-4 text-center bg-[#E8F4F4]/40">
                        {youHave ? (
                          <span className="inline-flex items-center gap-1 text-[#157F3D] font-bold text-[11px]">
                            <Check className="h-3.5 w-3.5" /> Unlocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[#6B7785] text-[11px]">
                            <Lock className="h-3 w-3 text-[#A15C07]" /> Gated
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= FREQUENTLY ASKED QUESTIONS ================= */}
      <div className="bg-white border border-[#E2E6EA] rounded-[8px] p-5 shadow-2xs space-y-3">
        <h3 className="text-[15px] font-bold text-[#18212B]">
          Frequently Asked Questions
        </h3>
        <div className="divide-y divide-[#E2E6EA] border-t border-[#E2E6EA]">
          {FAQS.map((faq, idx) => (
            <div key={idx} className="py-3">
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between text-left font-semibold text-[13px] text-[#18212B] hover:text-[#008080]"
              >
                <span>{faq.q}</span>
                {openFaq === idx ? (
                  <ChevronUp className="h-4 w-4 text-[#6B7785] shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-[#6B7785] shrink-0" />
                )}
              </button>
              {openFaq === idx && (
                <p className="text-[12px] text-[#556270] mt-2 leading-relaxed pl-1">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
