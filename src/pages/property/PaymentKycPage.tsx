import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, RefreshCw, AlertCircle, ShieldCheck, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { refreshEasebuzzKycLink, getPaymentSettings } from "@/api/propertyOwner";
import { openCenteredPopup } from "@/components/property/PaymentKycModal";

export const PaymentKycPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [kycUrl, setKycUrl] = useState<string>(searchParams.get("kycUrl") || "");
  const [loading, setLoading] = useState(!searchParams.get("kycUrl"));
  const [error, setError] = useState<string | null>(null);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [framingBlocked, setFramingBlocked] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLink = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await refreshEasebuzzKycLink();
      if (res.kycUrl) {
        setKycUrl(res.kycUrl);
      } else {
        setError("Easebuzz did not return a valid KYC access link. Please verify your banking details.");
      }
    } catch (err: any) {
      const status = err?.status;
      let desc = err?.message || "Failed to generate KYC link.";
      if (status === 502) {
        desc = "Easebuzz gateway returned a temporary error (502). Please try again in a few moments.";
      }
      setError(desc);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!kycUrl) {
      fetchLink();
    }
  }, []);

  const handleRefreshStatus = async () => {
    setRefreshing(true);
    try {
      await getPaymentSettings();
      await fetchLink();
    } finally {
      setRefreshing(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Bar */}
      <header className="bg-white border-b border-border px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-teal-600" />
              Easebuzz KYC Verification
            </h1>
            <p className="text-xs text-muted-foreground">
              Complete sub-merchant KYC to enable automated UPI rent settlements.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {kycUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => openCenteredPopup(kycUrl)}
              className="h-8 text-xs gap-1.5"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Open in Popup</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshStatus}
            disabled={refreshing || loading}
            className="h-8 text-xs gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh Status</span>
          </Button>

          <Button
            size="sm"
            onClick={handleBack}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-8 px-4"
          >
            Done
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative flex flex-col items-center justify-center">
        {loading && (
          <div className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-sm font-semibold text-foreground">Loading KYC Portal…</p>
            <p className="text-xs text-muted-foreground mt-1">Connecting to Easebuzz server</p>
          </div>
        )}

        {!loading && error && (
          <div className="max-w-md w-full mx-4 p-6 bg-white rounded-xl border border-red-200 shadow-sm text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600 mx-auto mb-3">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h2 className="text-base font-bold text-foreground">Could Not Open KYC Portal</h2>
            <p className="text-xs sm:text-sm text-red-600 mt-2 bg-red-50 p-3 rounded-lg border border-red-100 font-mono text-left break-words">
              {error}
            </p>
            <div className="mt-5 flex gap-2 justify-center">
              <Button onClick={fetchLink} className="bg-primary hover:bg-primary/90 text-white text-xs h-9">
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Try Again
              </Button>
              <Button variant="outline" onClick={handleBack} className="text-xs h-9">
                Go Back
              </Button>
            </div>
          </div>
        )}

        {!loading && !error && kycUrl && (
          <div className="w-full h-[calc(100vh-65px)] relative bg-white">
            {iframeLoading && !framingBlocked && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/95">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                <p className="text-sm font-semibold text-foreground">Rendering Verification Form…</p>
              </div>
            )}

            {framingBlocked ? (
              <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 mb-4">
                  <AlertCircle className="h-7 w-7" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  Embedded Verification Restricted
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-md mt-1.5 leading-relaxed">
                  Easebuzz security policies prevent rendering this portal inside an iframe. Please complete the verification in a popup window.
                </p>
                <div className="mt-5 flex gap-3">
                  <Button
                    onClick={() => openCenteredPopup(kycUrl)}
                    className="bg-primary hover:bg-primary/90 text-white text-xs sm:text-sm h-10 px-5 gap-2"
                  >
                    <ExternalLink className="h-4 w-4" /> Open KYC in Popup Window
                  </Button>
                  <Button variant="outline" onClick={handleRefreshStatus} className="text-xs sm:text-sm h-10 px-4">
                    Refresh Status
                  </Button>
                </div>
              </div>
            ) : (
              <iframe
                src={kycUrl}
                title="Easebuzz Submerchant KYC"
                className="w-full h-full border-0"
                allow="camera; microphone; geolocation; clipboard-write; payment"
                sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-modals"
                onLoad={() => setIframeLoading(false)}
                onError={() => {
                  setIframeLoading(false);
                  setFramingBlocked(true);
                }}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
};
