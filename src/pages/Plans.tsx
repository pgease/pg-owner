import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  Phone,
  MessageCircle,
  AlertTriangle,
  Minus,
  Plus,
  CheckCircle2,
  Check,
  Clock,
} from "lucide-react";
import {
  usePlansList,
  useCurrentPlan,
  useCreatePlanCheckoutOrderMutation,
  useVerifyPlanPaymentMutation,
  useAllRoomsAndCounts,
} from "@/hooks/usePropertyOwnerQueries";
import { useSubscriptionAccess } from "@/hooks/useSubscriptionAccess";
import { useApp } from "@/context/AppContext";
import { toast } from "@/components/ui/use-toast";
import { formatINR } from "@/lib/formatters";
import { getPaymentSettings, updatePaymentSettings } from "@/api/propertyOwner";
import { SUPPORT_PHONE_TEL, supportWhatsAppUrl } from "@/config/links";
import { cn } from "@/lib/utils";
import { launchEasebuzzCheckout } from "@/lib/easebuzzCheckout";
import { EasebuzzGatewayCard } from "@/components/property/EasebuzzGatewayCard";

declare global {
  interface Window {
    Razorpay?: any;
    EasebuzzCheckout?: any;
  }
}

export default function Plans() {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [selectedGateway, setSelectedGateway] = useState<"easebuzz" | "razorpay">("easebuzz");
  const [payMode, setPayMode] = useState<"MANUAL" | "GATEWAY">("MANUAL");
  const [upiId, setUpiId] = useState("");
  const [kycStatus, setKycStatus] = useState("not_submitted");
  const [payMessage, setPayMessage] = useState("");
  const [savingPay, setSavingPay] = useState(false);
  const [savingUpi, setSavingUpi] = useState(false);

  const { data: plansData } = usePlansList();
  const { refetch: refetchCurrentPlan } = useCurrentPlan();
  const subAccess = useSubscriptionAccess();
  const { selectedPgId, properties } = useApp();

  // Dynamic plans resolution from API
  const plansList: any[] = useMemo(() => {
    if (Array.isArray(plansData?.plans) && plansData.plans.length > 0) {
      return plansData.plans;
    }
    if (plansData?.catalog?.name || (plansData as any)?.name) {
      const cat = plansData.catalog || plansData;
      return [
        {
          id: (cat as any).id || (plansData as any)?.id || "pro",
          name: cat.name || "PG Ease Pro",
          displayName: (cat as any).displayName || cat.name || "PG Ease Pro",
          description:
            (cat as any).description ||
            "Complete PG management system with rent collection, tenant KYC, and automated reminders.",
          features: cat.features || (plansData as any)?.features || [],
          offer: cat.offer || (plansData as any)?.offer,
          cycles: cat.cycles || (plansData as any)?.cycles,
          pricePerBed: (cat as any).pricePerBed,
        },
      ];
    }
    return [];
  }, [plansData]);

  const [selectedPlanId, setSelectedPlanId] = useState<string>("");

  useEffect(() => {
    if (plansList.length > 0 && (!selectedPlanId || !plansList.some((p: any) => p.id === selectedPlanId))) {
      setSelectedPlanId(plansList[0].id);
    }
  }, [plansList, selectedPlanId]);

  const activePlan = useMemo(() => {
    return plansList.find((p: any) => p.id === selectedPlanId) || plansList[0] || null;
  }, [plansList, selectedPlanId]);

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
        setKycStatus(settings.kycStatus || "not_submitted");
        setPayMessage(settings.message || "");
      })
      .catch(() => {});
  }, []);

  const savePaymentMode = async (next: "MANUAL" | "GATEWAY") => {
    const ok = window.confirm(
      next === "GATEWAY"
        ? "Tenants will pay inside the app. Until KYC is approved, they still pay your UPI. Continue?"
        : "Tenants will pay your UPI. You check the payment and mark it paid. Continue?",
    );
    if (!ok) return;
    setSavingPay(true);
    try {
      const saved = await updatePaymentSettings({ paymentMode: next, upiId });
      setPayMode(saved.paymentMode === "GATEWAY" ? "GATEWAY" : "MANUAL");
      setUpiId(saved.upiId || "");
      setKycStatus(saved.kycStatus || "not_submitted");
      setPayMessage(saved.message || "");
      toast({ title: "Payment method updated", description: saved.message });
    } catch (err: any) {
      toast({ title: "Could not update payment method", description: err?.message, variant: "destructive" });
    } finally {
      setSavingPay(false);
    }
  };

  const saveUpi = async () => {
    setSavingUpi(true);
    try {
      const saved = await updatePaymentSettings({ paymentMode: payMode, upiId });
      setUpiId(saved.upiId || "");
      setPayMessage(saved.message || "");
      toast({ title: "UPI ID saved" });
    } catch (err: any) {
      toast({ title: "Could not save UPI ID", description: err?.message, variant: "destructive" });
    } finally {
      setSavingUpi(false);
    }
  };

  const createOrderMut = useCreatePlanCheckoutOrderMutation();
  const verifyPaymentMut = useVerifyPlanPaymentMutation();

  // Dynamic pricing calculation from active plan in API
  const getPlanMonthlyRate = (plan: any) => {
    if (!plan) return 49;
    if (plan.pricing?.monthly?.pricePerBed != null && Number(plan.pricing.monthly.pricePerBed) > 0) {
      return Number(plan.pricing.monthly.pricePerBed);
    }
    if (plan.cycles?.monthly?.pricePerBed != null && Number(plan.cycles.monthly.pricePerBed) > 0) {
      return Number(plan.cycles.monthly.pricePerBed);
    }
    if (plan.pricePerBed != null && Number(plan.pricePerBed) > 0) return Number(plan.pricePerBed);
    if (plan.price != null && Number(plan.price) > 0) return Number(plan.price);
    return 49;
  };

  const getPlanYearlyRate = (plan: any) => {
    if (!plan) return 490;
    if (plan.pricing?.yearly?.pricePerBed != null && Number(plan.pricing.yearly.pricePerBed) > 0) {
      return Number(plan.pricing.yearly.pricePerBed);
    }
    if (plan.cycles?.yearly?.pricePerBed != null && Number(plan.cycles.yearly.pricePerBed) > 0) {
      return Number(plan.cycles.yearly.pricePerBed);
    }
    if (plan.priceAnnual != null && Number(plan.priceAnnual) > 0) return Number(plan.priceAnnual);
    const m = getPlanMonthlyRate(plan);
    return m * 10;
  };

  const activeMonthlyRate = useMemo(() => getPlanMonthlyRate(activePlan), [activePlan]);
  const activeYearlyRate = useMemo(() => getPlanYearlyRate(activePlan), [activePlan]);

  const activeMonthlyStrike = useMemo(() => {
    if (!activePlan) return null;
    const strike =
      activePlan.pricing?.monthly?.strikePerBed ??
      activePlan.cycles?.monthly?.strikePerBed ??
      activePlan.strikePrice ??
      null;
    return strike ? Number(strike) : null;
  }, [activePlan]);

  const activeYearlyStrike = useMemo(() => {
    if (!activePlan) return null;
    const strike =
      activePlan.pricing?.yearly?.strikePerBed ??
      activePlan.cycles?.yearly?.strikePerBed ??
      null;
    return strike ? Number(strike) : null;
  }, [activePlan]);

  const unitRate = billingCycle === "annual" ? activeYearlyRate : activeMonthlyRate;
  const strikeRate = billingCycle === "annual" ? activeYearlyStrike : activeMonthlyStrike;

  const subtotal = unitRate * selectedBeds;
  const gstPercent = Number(plansData?.gstPercent ?? (plansData as any)?.catalog?.gstPercent ?? 18);
  const gstAmount = Math.round(subtotal * gstPercent) / 100;
  const planTotal = Math.round((subtotal + gstAmount) * 100) / 100;

  const activeOfferBadge =
    activePlan?.offer?.badge ||
    (activePlan?.offer?.enabled ? activePlan?.offer?.badge : null) ||
    plansData?.offer?.badge ||
    null;

  const kycText = (() => {
    const status = kycStatus.toLowerCase();
    if (status === "active" || status === "approved") return "KYC approved. Automatic collection can run.";
    if (status === "pending") return "KYC is being checked. Until it is approved, tenants pay your UPI.";
    return "KYC has not been started. Until it is approved, tenants pay your UPI.";
  })();

  const handleUpgradeCheckout = async () => {
    if (!activePlan?.id) {
      toast({
        title: "No plan selected",
        description: "Please select an active subscription plan.",
        variant: "destructive",
      });
      return;
    }

    try {
      const planId = activePlan.id;
      const order = await createOrderMut.mutateAsync({
        planId,
        billingCycle,
        numberOfBeds: selectedBeds,
        gateway: selectedGateway,
      });

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
                  gateway: "easebuzz",
                  txnid: response_data.txnid || order.orderId,
                  easebuzz_id: response_data.easebuzz_id,
                  hash: response_data.hash,
                  status: response_data.status,
                  easebuzz_response: response_data,
                  planId,
                  billingCycle,
                  numberOfBeds: selectedBeds,
                });
                toast({
                  title: "Subscription Activated! 👑",
                  description: `Your account has been upgraded to ${activePlan?.displayName || activePlan?.name || "Pro"} for ${selectedBeds} beds.`,
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

      if (!order?.keyId) {
        toast({
          title: "Checkout is not ready",
          description: "The payment gateway did not return a live key. Nothing was charged.",
          variant: "destructive",
        });
        return;
      }

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "PG Ease",
        description: `${activePlan.displayName || activePlan.name} (${selectedBeds} beds, ${billingCycle})`,
        order_id: order.orderId,
        handler: async (response: any) => {
          try {
            await verifyPaymentMut.mutateAsync({
              gateway: "razorpay",
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              planId,
              billingCycle,
              numberOfBeds: selectedBeds,
            });
            toast({
              title: "Subscription Activated! 👑",
              description: `Your account has been upgraded to ${activePlan.displayName || activePlan.name} for ${selectedBeds} beds.`,
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
    <div className="max-w-2xl mx-auto space-y-5 pb-16">
      <div>
        <h1 className="hidden md:block text-2xl font-bold text-[#18212B]">Plans & Subscription</h1>
        <p className="mt-1 text-sm text-[#556270]">Select a plan for your PG. WhatsApp notifications are 100% free forever on all plans.</p>
        <div className="mt-3">
          {subAccess.isTrial ? (
            <span className="inline-flex items-center gap-1 rounded bg-[#FFF7E6] px-2.5 py-1 text-xs font-semibold text-[#A15C07]">
              <Clock className="h-3.5 w-3.5" />
              Free trial: {subAccess.trialDaysRemaining} days left
            </span>
          ) : subAccess.isExpired ? (
            <span className="inline-flex items-center gap-1 rounded bg-[#FEF1F0] px-2.5 py-1 text-xs font-semibold text-[#B42318]">
              <AlertTriangle className="h-3.5 w-3.5" />
              Trial ended. Choose a plan below to keep full editing access.
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded bg-[#ECFAF1] px-2.5 py-1 text-xs font-semibold text-[#157F3D]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {subAccess.planDisplayName} is active
            </span>
          )}
        </div>
      </div>

      {subAccess.isExpired && (
        <div className="rounded-lg border border-[#F6C7C2] bg-[#FEF1F0] p-4 text-sm text-[#7A1E14]">
          Your data is safe and viewable. Pick Lite or Pro below to continue adding residents and recording payments.
          <div className="mt-3 flex gap-2">
            <a href={SUPPORT_PHONE_TEL} className="inline-flex items-center gap-1 rounded border bg-white px-3 py-1.5 text-xs font-semibold text-[#18212B]">
              <Phone className="h-3.5 w-3.5" /> Call Support
            </a>
            <a href={supportWhatsAppUrl("Hi, my PG Ease trial has expired and I want to activate my plan.")} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded bg-[#157F3D] px-3 py-1.5 text-xs font-semibold text-white">
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp Support
            </a>
          </div>
        </div>
      )}

      {/* Step 1: Select Plan & Capacity */}
      <section className="rounded-xl border border-[#E2E6EA] bg-white p-5 shadow-sm space-y-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#008080]">Step 1</p>
          <h2 className="mt-1 text-lg font-bold text-[#18212B]">
            {plansList.length > 1 ? "Choose Your Plan" : (activePlan?.displayName || activePlan?.name || "Subscription Plan")}
          </h2>
          <p className="mt-0.5 text-xs text-[#556270]">
            {plansList.length > 1
              ? "Select the plan that fits your PG's collection style."
              : `${activePlan?.displayName || activePlan?.name || "PG Ease Pro"} is priced per bed. GST is added at checkout.`}
          </p>
        </div>

        {/* Dynamic Plan Cards from API */}
        {plansList.length > 1 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {plansList.map((plan: any) => {
              const isSelected = plan.id === selectedPlanId;
              const mRate = getPlanMonthlyRate(plan);
              const yRate = getPlanYearlyRate(plan);
              const rate = billingCycle === "annual" ? yRate : mRate;
              const features: string[] = Array.isArray(plan.features) ? plan.features : [];

              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={cn(
                    "rounded-xl border p-4 text-left transition-all relative flex flex-col justify-between cursor-pointer",
                    isSelected
                      ? "border-[#008080] bg-[#E8F4F4]/50 ring-2 ring-[#008080]"
                      : "border-[#E2E6EA] bg-white hover:border-slate-300",
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-[#18212B]">
                        {plan.displayName || plan.name}
                      </span>
                      {isSelected ? (
                        <CheckCircle2 className="h-5 w-5 text-[#008080]" />
                      ) : null}
                    </div>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-2xl font-extrabold text-[#18212B]">
                        ₹{rate}
                      </span>
                      <span className="text-xs text-[#556270]">
                        / bed / {billingCycle === "annual" ? "year" : "month"}
                      </span>
                    </div>
                    {plan.description && (
                      <p className="mt-1.5 text-xs text-[#556270] leading-relaxed">
                        {plan.description}
                      </p>
                    )}
                    {features.length > 0 && (
                      <ul className="mt-3 space-y-1.5 text-xs text-slate-700">
                        {features.slice(0, 5).map((f: string, i: number) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <Check className="h-3.5 w-3.5 text-[#008080] shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          /* Single Plan Card (matches API when 1 plan is configured) */
          activePlan && (
            <div className="rounded-xl border border-[#008080] bg-[#E8F4F4]/40 p-4.5 space-y-3 relative">
              {activeOfferBadge && (
                <div className="inline-block rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-800 text-[11px] font-bold px-2.5 py-0.5">
                  {activeOfferBadge}
                </div>
              )}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#18212B]">
                    {activePlan.displayName || activePlan.name || "PG Ease Pro"}
                  </h3>
                  <p className="text-xs text-[#556270] mt-0.5">
                    {activePlan.description || "Complete PG management system with automated rent collection, KYC, and instant reminders."}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-baseline justify-end gap-1.5">
                    {strikeRate && strikeRate > unitRate && (
                      <span className="text-sm text-slate-400 line-through font-semibold">
                        ₹{strikeRate}
                      </span>
                    )}
                    <span className="text-2xl font-extrabold text-[#18212B]">
                      ₹{unitRate}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#556270]">
                    per bed / {billingCycle === "annual" ? "year" : "month"}
                  </span>
                </div>
              </div>

              {/* Dynamic Feature list from API */}
              {Array.isArray(activePlan.features) && activePlan.features.length > 0 && (
                <div className="pt-2 border-t border-teal-600/15 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-700">
                  {activePlan.features.map((feat: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-[#008080] shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        )}

        {/* Capacity Selector */}
        <div>
          <label className="block text-sm font-semibold text-[#18212B]">How many beds do you have?</label>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <div className="flex h-10 items-center overflow-hidden rounded-md border border-[#C8CFD6]">
              <button
                type="button"
                aria-label="Fewer beds"
                disabled={selectedBeds <= 10}
                onClick={() => setSelectedBeds((b) => Math.max(10, b - 5))}
                className="h-full w-10 text-[#556270] hover:bg-[#F6F7F8] disabled:opacity-30 cursor-pointer"
              >
                <Minus className="mx-auto h-4 w-4" />
              </button>
              <div className="min-w-[88px] text-center text-sm font-bold text-[#18212B]">{selectedBeds} beds</div>
              <button
                type="button"
                aria-label="More beds"
                disabled={selectedBeds >= 1000}
                onClick={() => setSelectedBeds((b) => Math.min(1000, b + 5))}
                className="h-full w-10 border-l border-[#E2E6EA] text-[#556270] hover:bg-[#F6F7F8] disabled:opacity-30 cursor-pointer"
              >
                <Plus className="mx-auto h-4 w-4" />
              </button>
            </div>
            {[25, 50, 100].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setSelectedBeds(preset)}
                className={`h-10 rounded-md border px-3 text-sm font-semibold cursor-pointer ${selectedBeds === preset ? "border-[#008080] bg-[#008080] text-white" : "border-[#E2E6EA] bg-[#F6F7F8] text-[#556270]"}`}
              >
                {preset}
              </button>
            ))}
          </div>
          {detectedBeds > 0 && (
            <button
              type="button"
              onClick={() => setSelectedBeds(Math.max(10, detectedBeds))}
              className="mt-2 text-sm font-semibold text-[#008080] hover:underline cursor-pointer"
            >
              Use the {detectedBeds} beds already in {selectedPg?.name || "your PG"}
            </button>
          )}
        </div>

        {/* Monthly vs Annual Toggle */}
        <div>
          <p className="text-sm font-semibold text-[#18212B]">Pay every month, or once a year?</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={`rounded-lg border p-3 text-left cursor-pointer ${billingCycle === "monthly" ? "border-[#008080] bg-[#E8F4F4]" : "border-[#E2E6EA] bg-white"}`}
            >
              <div className="text-sm font-bold text-[#18212B]">Monthly</div>
              <div className="text-xs text-[#556270]">
                ₹{activeMonthlyRate} per bed
              </div>
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("annual")}
              className={`rounded-lg border p-3 text-left cursor-pointer ${billingCycle === "annual" ? "border-[#008080] bg-[#E8F4F4]" : "border-[#E2E6EA] bg-white"}`}
            >
              <div className="text-sm font-bold text-[#18212B]">Yearly</div>
              <div className="text-xs text-[#157F3D] font-semibold">2 months free (₹{activeYearlyRate}/bed)</div>
            </button>
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="border-t border-[#EEF1F3] pt-4">
          <p className="text-sm text-[#556270]">
            You pay for {activePlan?.displayName || activePlan?.name || "PG Ease Pro"}
          </p>
          <p className="text-3xl font-extrabold text-[#18212B]">
            {formatINR(planTotal)} <span className="text-sm font-medium text-[#556270]">/ {billingCycle === "annual" ? "year" : "month"}</span>
          </p>
          <p className="mt-1 text-xs text-[#6B7785]">
            {selectedBeds} beds × ₹{unitRate} + {gstPercent}% GST ({formatINR(gstAmount)})
          </p>
        </div>

        {/* Gateway Selector */}
        <div className="mt-4 p-3 bg-[#F6F7F8] rounded-lg border border-[#E2E6EA]">
          <p className="text-xs font-bold text-[#18212B] mb-2">Select Payment Gateway:</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSelectedGateway("easebuzz")}
              className={`p-2.5 rounded-md border text-left flex items-center justify-between text-xs font-bold transition cursor-pointer ${
                selectedGateway === "easebuzz"
                  ? "border-[#008080] bg-[#E8F4F4] text-[#008080] ring-1 ring-[#008080]"
                  : "border-[#E2E6EA] bg-white text-[#556270] hover:border-[#C8CFD6]"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#008080]"></span>
                <span>Easebuzz</span>
              </div>
              <span className="text-[10px] text-[#6B7785] font-normal">Fast UPI / Card</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedGateway("razorpay")}
              className={`p-2.5 rounded-md border text-left flex items-center justify-between text-xs font-bold transition cursor-pointer ${
                selectedGateway === "razorpay"
                  ? "border-blue-600 bg-blue-50 text-blue-800 ring-1 ring-blue-600"
                  : "border-[#E2E6EA] bg-white text-[#556270] hover:border-[#C8CFD6]"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span>Razorpay</span>
              </div>
              <span className="text-[10px] text-[#6B7785] font-normal">All Options</span>
            </button>
          </div>
        </div>

        <button
          type="button"
          disabled={createOrderMut.isPending || !activePlan}
          onClick={handleUpgradeCheckout}
          className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#008080] text-sm font-semibold text-white hover:bg-[#006B6B] disabled:opacity-50 cursor-pointer shadow-sm"
        >
          {createOrderMut.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <span>
              Pay {formatINR(planTotal)} for {activePlan?.displayName || activePlan?.name || "PG Ease Pro"} via {selectedGateway === "easebuzz" ? "Easebuzz ⚡" : "Razorpay 💳"}
            </span>
          )}
        </button>
      </section>

      {/* Step 2: Tenant Collection Method */}
      <section className="space-y-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#008080]">Step 2</p>
          <h2 className="mt-1 text-lg font-bold text-[#18212B]">How should tenants pay rent?</h2>
          <p className="mt-1 text-sm text-[#556270]">Automated online UPI gateway with Easebuzz direct bank settlement or direct manual UPI collection.</p>
        </div>

        <EasebuzzGatewayCard />
      </section>

      <button
        type="button"
        onClick={() => navigate("/referrals")}
        className="text-sm font-semibold text-[#008080] hover:underline cursor-pointer"
      >
        Know another PG owner? Invite them and earn ₹1,000.
      </button>
    </div>
  );
}
