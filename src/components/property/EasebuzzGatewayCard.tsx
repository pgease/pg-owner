import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Building,
  Check,
  Copy,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import {
  getPaymentSettings,
  startEasebuzzKyc,
  refreshEasebuzzKycLink,
  toggleEasebuzzOnline,
  type PaymentSettings,
} from "@/api/propertyOwner";
import { useSubscriptionAccess } from "@/hooks/useSubscriptionAccess";

export const EasebuzzGatewayCard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await getPaymentSettings();
      setSettings(data);
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
  }, []);

  const handleStartKyc = async () => {
    setActionLoading(true);
    try {
      const res = await startEasebuzzKyc();
      toast({
        title: "Easebuzz Onboarding Initiated",
        description: "Opening Easebuzz KYC dashboard in a new tab...",
      });
      if (res.kycUrl) {
        window.open(res.kycUrl, "_blank", "noopener,noreferrer");
      }
      await fetchSettings();
    } catch (err: any) {
      toast({
        title: "Could not initiate KYC",
        description: err?.message || "Failed to start sub-merchant onboarding.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefreshKyc = async () => {
    setActionLoading(true);
    try {
      const res = await refreshEasebuzzKycLink();
      toast({
        title: "KYC Link Refreshed",
        description: "Opening Easebuzz verification link...",
      });
      if (res.kycUrl) {
        window.open(res.kycUrl, "_blank", "noopener,noreferrer");
      }
      await fetchSettings();
    } catch (err: any) {
      toast({
        title: "Could not refresh KYC link",
        description: err?.message || "Failed to get fresh KYC link.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

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
          ? "Tenants can now pay rent instantly via UPI inside the tenant portal."
          : "Tenants will use manual UPI transfer with UTR submission.",
      });
    } catch (err: any) {
      toast({
        title: "Failed to update toggle",
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

  const subAccess = useSubscriptionAccess();
  const sub = settings?.submerchant;
  const isPro = Boolean(
    settings?.isProPlan ||
    subAccess.currentPlan === "PRO" ||
    subAccess.hasAutomatedGateway ||
    subAccess.isTrial
  );
  const subStatus = sub?.status || "NOT_STARTED";
  const isSubActive = subStatus === "ACTIVE";
  const isOnlineActive = Boolean(sub?.onlinePaymentsEnabled && isSubActive && isPro);

  return (
    <Card className="border border-border/80 shadow-sm bg-white overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-teal-500/10 via-teal-500/5 to-transparent pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                  Online UPI Payments (Easebuzz Gateway)
                  {isOnlineActive ? (
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-bold">
                      Live & Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground text-[10px]">
                      {isSubActive ? "Ready to Enable" : "Setup Required"}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Direct UPI collection with automatic bank settlement and tenant ledger reconciliation.
                </CardDescription>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={fetchSettings}
            disabled={loading || actionLoading}
            className="h-8 text-xs self-start sm:self-center text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Sync Status
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-4">
        {/* Plan Gating Notice */}
        {!loading && !subAccess.isLoading && !isPro && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Sparkles className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900">
                <span className="font-bold block">PG Ease Pro Feature</span>
                Automated UPI Gateway is available exclusively on PG Ease Pro (₹49/bed/month). Free plan includes manual UPI collection.
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => navigate("/plans")}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 h-8"
            >
              Upgrade to Pro
            </Button>
          </div>
        )}

        {/* Sub-Merchant Overview Card */}
        <div className="rounded-xl border border-border/70 bg-slate-50/60 p-4 space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Easebuzz Sub-Merchant KYC
            </span>

            {/* KYC Status Badge */}
            {subStatus === "ACTIVE" ? (
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-xs gap-1.5 self-start sm:self-center">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Active & Verified
              </Badge>
            ) : subStatus === "KYC_PENDING" ? (
              <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-bold text-xs gap-1.5 self-start sm:self-center">
                <Clock className="h-3.5 w-3.5 text-amber-600" />
                KYC Verification Pending
              </Badge>
            ) : subStatus === "REJECTED" ? (
              <Badge className="bg-red-100 text-red-800 border-red-300 font-bold text-xs gap-1.5 self-start sm:self-center">
                <AlertCircle className="h-3.5 w-3.5 text-red-600" />
                KYC Action Required
              </Badge>
            ) : (
              <Badge variant="outline" className="text-slate-600 bg-white border-slate-300 font-bold text-xs self-start sm:self-center">
                Not Started
              </Badge>
            )}
          </div>

          {/* Sub-merchant Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {sub?.submerchantId && (
              <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-border/60">
                <span className="text-muted-foreground">Sub-Merchant ID</span>
                <div className="flex items-center gap-1.5 font-mono font-bold text-foreground">
                  <span>{sub.submerchantId}</span>
                  <button
                    onClick={() => copySubmerchantId(sub.submerchantId)}
                    className="text-muted-foreground hover:text-primary"
                    title="Copy ID"
                  >
                    {copiedId ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
              </div>
            )}

            {sub?.bankLast4 ? (
              <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-border/60">
                <span className="text-muted-foreground">Settlement A/C</span>
                <span className="font-mono font-bold text-foreground">
                  •••• {sub.bankLast4} {sub.bankName ? `(${sub.bankName})` : ""}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-border/60">
                <span className="text-muted-foreground">Settlement A/C</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/my-pgs/bank")}
                  className="h-7 text-xs text-primary border-primary/40 hover:bg-primary/5 font-semibold"
                >
                  <Building className="h-3 w-3 mr-1" />
                  Link Bank Account
                </Button>
              </div>
            )}
          </div>

          {/* KYC Action Buttons */}
          <div className="pt-1 flex flex-wrap gap-2">
            {!sub || subStatus === "NOT_STARTED" ? (
              <Button
                size="sm"
                onClick={handleStartKyc}
                disabled={actionLoading || !isPro}
                className="bg-primary hover:bg-primary/90 text-white font-bold text-xs h-9 gap-1.5"
              >
                <ShieldCheck className="h-4 w-4" />
                Start Easebuzz KYC Onboarding
              </Button>
            ) : subStatus === "KYC_PENDING" ? (
              <>
                <Button
                  size="sm"
                  onClick={handleRefreshKyc}
                  disabled={actionLoading}
                  className="bg-primary hover:bg-primary/90 text-white font-bold text-xs h-9 gap-1.5"
                >
                  <ExternalLink className="h-4 w-4" />
                  Resume KYC Form on Easebuzz
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={fetchSettings}
                  disabled={actionLoading}
                  className="text-xs h-9"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1" /> Check Approval
                </Button>
              </>
            ) : subStatus === "REJECTED" ? (
              <Button
                size="sm"
                onClick={handleStartKyc}
                disabled={actionLoading}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-9 gap-1.5"
              >
                <AlertCircle className="h-4 w-4" />
                Re-submit Easebuzz KYC
              </Button>
            ) : (
              sub.kycDashboardUrl && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(sub.kycDashboardUrl!, "_blank", "noopener,noreferrer")}
                  className="text-xs h-8 text-muted-foreground hover:text-foreground gap-1"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View Easebuzz Merchant Portal
                </Button>
              )
            )}
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

        {/* Feature Highlights Footer */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs text-muted-foreground">
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
    </Card>
  );
};

