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

declare global {
  interface Window {
    Razorpay?: any;
  }
}


export default function Plans() {
  // Two steps: pay for PG Ease, then choose how tenants pay.
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
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

  const STATIC_CATALOG = {
    name: "PG Ease Pro",
    gstPercent: 18,
    offer: { enabled: true, badge: "🪔 Diwali Offer – Grab it soon!" },
    features: [
      "Unlimited Beds & Rooms Management",
      "Automated Rent Reminders (WhatsApp & SMS)",
      "Digital Tenant KYC Verification",
      "Online Rent Collection (Manual UPI & Gateway)",
      "Expense, Deposit & Profit Tracking",
      "Staff & Property Manager Access",
      "Digital Rental Agreements",
      "24/7 Priority Support",
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

  const kycText = (() => {
    const status = kycStatus.toLowerCase();
    if (status === "active" || status === "approved") return "KYC approved. Automatic collection can run.";
    if (status === "pending") return "KYC is being checked. Until it is approved, tenants pay your UPI.";
    return "KYC has not been started. Until it is approved, tenants pay your UPI.";
  })();

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
    <div className="max-w-xl mx-auto space-y-5 pb-16">
      <div>
        <h1 className="text-2xl font-bold text-[#18212B]">Your plan</h1>
        <p className="mt-1 text-sm text-[#556270]">Two steps. First pay for PG Ease. Then choose how tenants pay you.</p>
        <div className="mt-3">
          {subAccess.isTrial ? (
            <span className="inline-flex items-center gap-1 rounded bg-[#FFF7E6] px-2.5 py-1 text-xs font-semibold text-[#A15C07]">
              <Clock className="h-3.5 w-3.5" />
              Free trial: {subAccess.trialDaysRemaining} days left
            </span>
          ) : subAccess.isExpired ? (
            <span className="inline-flex items-center gap-1 rounded bg-[#FEF1F0] px-2.5 py-1 text-xs font-semibold text-[#B42318]">
              <AlertTriangle className="h-3.5 w-3.5" />
              Trial ended. Pay below to keep full access.
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
          Your data is still here. Tenants can still pay. Pay for PG Ease Pro to edit again.
          <div className="mt-3 flex gap-2">
            <a href={SUPPORT_PHONE_TEL} className="inline-flex items-center gap-1 rounded border bg-white px-3 py-1.5 text-xs font-semibold text-[#18212B]">
              <Phone className="h-3.5 w-3.5" /> Call
            </a>
            <a href={supportWhatsAppUrl("Hi, my PG Ease trial has expired and I want to activate my plan.")} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded bg-[#157F3D] px-3 py-1.5 text-xs font-semibold text-white">
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
            </a>
          </div>
        </div>
      )}

      <section className="rounded-xl border border-[#E2E6EA] bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-[#008080]">Step 1</p>
        <h2 className="mt-1 text-lg font-bold text-[#18212B]">Pay for PG Ease Pro</h2>
        <p className="mt-1 text-sm text-[#556270]">
          {selectedCycle?.strikePerBed != null ? (
            <>
              <span className="line-through text-[#98A2AE]">₹{selectedCycle.strikePerBed}</span>{" "}
            </>
          ) : null}
          ₹{unitRate || "—"} per bed, {billingCycle === "annual" ? "per year" : "per month"}. GST {gstPercent}% is added.
          {selectedCycle?.note ? ` ${selectedCycle.note}.` : ""}
        </p>
        {catalog?.offer?.badge && (
          <p className="mt-2 inline-flex rounded bg-[#FFF7E6] px-2 py-1 text-xs font-semibold text-[#A15C07]">{catalog.offer.badge}</p>
        )}

        <label className="mt-5 block text-sm font-semibold text-[#18212B]">How many beds do you have?</label>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <div className="flex h-10 items-center overflow-hidden rounded-md border border-[#C8CFD6]">
            <button type="button" aria-label="Fewer beds" disabled={selectedBeds <= 10} onClick={() => setSelectedBeds((b) => Math.max(10, b - 5))} className="h-full w-10 text-[#556270] hover:bg-[#F6F7F8] disabled:opacity-30">
              <Minus className="mx-auto h-4 w-4" />
            </button>
            <div className="min-w-[88px] text-center text-sm font-bold text-[#18212B]">{selectedBeds} beds</div>
            <button type="button" aria-label="More beds" disabled={selectedBeds >= 1000} onClick={() => setSelectedBeds((b) => Math.min(1000, b + 5))} className="h-full w-10 border-l border-[#E2E6EA] text-[#556270] hover:bg-[#F6F7F8] disabled:opacity-30">
              <Plus className="mx-auto h-4 w-4" />
            </button>
          </div>
          {[25, 50, 100].map((preset) => (
            <button key={preset} type="button" onClick={() => setSelectedBeds(preset)} className={`h-10 rounded-md border px-3 text-sm font-semibold ${selectedBeds === preset ? "border-[#008080] bg-[#008080] text-white" : "border-[#E2E6EA] bg-[#F6F7F8] text-[#556270]"}`}>
              {preset}
            </button>
          ))}
        </div>
        {detectedBeds > 0 && (
          <button type="button" onClick={() => setSelectedBeds(Math.max(10, detectedBeds))} className="mt-2 text-sm font-semibold text-[#008080] hover:underline">
            Use the {detectedBeds} beds already in {selectedPg?.name || "your PG"}
          </button>
        )}

        <p className="mt-5 text-sm font-semibold text-[#18212B]">Pay every month, or once a year?</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setBillingCycle("monthly")} className={`rounded-lg border p-3 text-left ${billingCycle === "monthly" ? "border-[#008080] bg-[#E8F4F4]" : "border-[#E2E6EA] bg-white"}`}>
            <div className="text-sm font-bold text-[#18212B]">Monthly</div>
            <div className="text-xs text-[#556270]">₹{catalog?.cycles?.find((c) => c.cycle === "monthly")?.pricePerBed ?? 29} per bed</div>
          </button>
          <button type="button" onClick={() => setBillingCycle("annual")} className={`rounded-lg border p-3 text-left ${billingCycle === "annual" ? "border-[#008080] bg-[#E8F4F4]" : "border-[#E2E6EA] bg-white"}`}>
            <div className="text-sm font-bold text-[#18212B]">Yearly</div>
            <div className="text-xs text-[#157F3D]">2 months free</div>
          </button>
        </div>

        <div className="mt-5 border-t border-[#EEF1F3] pt-4">
          <p className="text-sm text-[#556270]">You pay</p>
          <p className="text-3xl font-extrabold text-[#18212B]">{selectedCycle ? formatINR(proTotal) : "—"} <span className="text-sm font-medium text-[#556270]">/ {billingCycle === "annual" ? "year" : "month"}</span></p>
          <p className="mt-1 text-xs text-[#6B7785]">{selectedBeds} beds × ₹{unitRate} + {gstPercent}% GST</p>
        </div>

        <button type="button" disabled={!selectedCycle || createOrderMut.isPending} onClick={() => handleUpgradeCheckout("PRO")} className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#008080] text-sm font-semibold text-white hover:bg-[#006B6B] disabled:opacity-50">
          {createOrderMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Pay {selectedCycle ? formatINR(proTotal) : ""}</span>}
        </button>
      </section>

      <section className="rounded-xl border border-[#E2E6EA] bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-[#008080]">Step 2</p>
        <h2 className="mt-1 text-lg font-bold text-[#18212B]">How should tenants pay rent?</h2>
        <p className="mt-1 text-sm text-[#556270]">This is separate from Step 1. Pick one. You can change it later.</p>

        <div className="mt-4 grid gap-2">
          <button type="button" disabled={savingPay} onClick={() => savePaymentMode("MANUAL")} className={`rounded-lg border p-4 text-left ${payMode === "MANUAL" ? "border-[#008080] bg-[#E8F4F4]" : "border-[#E2E6EA] bg-white"}`}>
            <div className="text-sm font-bold text-[#18212B]">They pay my UPI</div>
            <div className="mt-1 text-xs text-[#556270]">The tenant sends money to your UPI. You check it and mark it paid. No extra fee.</div>
          </button>
          <button type="button" disabled={savingPay} onClick={() => savePaymentMode("GATEWAY")} className={`rounded-lg border p-4 text-left ${payMode === "GATEWAY" ? "border-[#008080] bg-[#E8F4F4]" : "border-[#E2E6EA] bg-white"}`}>
            <div className="text-sm font-bold text-[#18212B]">Collect automatically</div>
            <div className="mt-1 text-xs text-[#556270]">The tenant pays in the app and the money comes to you. This needs KYC.</div>
          </button>
        </div>

        {payMessage && <p className="mt-3 text-sm text-[#18212B]">{payMessage}</p>}

        <label className="mt-4 block text-sm font-semibold text-[#18212B]">
          Your UPI ID
          <input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="name@upi" className="mt-1 h-10 w-full rounded-md border border-[#C8CFD6] px-3 text-sm font-normal text-[#18212B]" />
        </label>
        <button type="button" disabled={savingUpi} onClick={saveUpi} className="mt-2 h-9 rounded-md border border-[#C8CFD6] px-3 text-sm font-semibold text-[#18212B] hover:bg-[#F6F7F8] disabled:opacity-50">
          {savingUpi ? "Saving…" : "Save UPI ID"}
        </button>
        <p className="mt-3 text-sm text-[#556270]">{kycText}</p>
      </section>

      <button type="button" onClick={() => navigate("/referrals")} className="text-sm font-semibold text-[#008080] hover:underline">
        Know another PG owner? Invite them and earn ₹1,000.
      </button>
    </div>
  );
}
