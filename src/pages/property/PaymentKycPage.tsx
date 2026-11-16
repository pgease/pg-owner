import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, RefreshCw, AlertCircle, ShieldCheck, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { refreshEasebuzzKycLink, getPaymentSettings } from "@/api/propertyOwner";
import { openKycUrl, isCapacitorApp } from "@/components/property/PaymentKycModal";

export const PaymentKycPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [kycUrl, setKycUrl] = useState<string>(searchParams.get("kycUrl") || "");
  const [loading, setLoading] = useState(!searchParams.get("kycUrl"));
  const [error, setError] = useState<string | null>(null);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [framingBlocked, setFramingBlocked] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasConfirmedLoadRef = useRef(false);

  const isNative = isCapacitorApp();

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

  useEffect(() => {
    if (kycUrl) {
      setIframeLoading(true);
      setFramingBlocked(false);
      hasConfirmedLoadRef.current = false;

      loadTimeoutRef.current = setTimeout(() => {
        if (!hasConfirmedLoadRef.current) {
          setFramingBlocked(true);
          setIframeLoading(false);
        }
      }, 8000);
    }

    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, [kycUrl]);

  const handleRefreshStatus = async () => {
    setRefreshing(true);
    try {
      await getPaymentSettings();
      toast({
        title: "Status Refreshed",
        description: "Payment settings and KYC status updated.",
      });
    } catch (err: any) {
      toast({
        title: "Refresh failed",
        description: err?.message || "Could not reach server.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleDone = async () => {
    try {
      await getPaymentSettings();
    } catch {
      /* ignore */
    }
    navigate(-1);
  };

  const handleOpenPopup = () => {
    openKycUrl(kycUrl, handleRefreshStatus);
  };

  const handleIframeLoad = (e: React.SyntheticEvent<HTMLIFrameElement>) => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
    setIframeLoading(false);

    let isBlank = false;
    try {
      const iframe = e.currentTarget;
      if (iframe.contentDocument) {
        const body = iframe.contentDocument.body;
        const currentHref = iframe.contentWindow?.location?.href;
        if (!body || body.innerHTML.trim() === "" || currentHref === "about:blank") {
          isBlank = true;
        }
      }
    } catch {
      // Cross-origin restriction is expected when external page renders
      isBlank = false;
    }

    if (isBlank) {
      setFramingBlocked(true);
    } else {
      hasConfirmedLoadRef.current = true;
      setFramingBlocked(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Bar */}
      <header className="bg-white border-b border-border px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDone}
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
              onClick={handleOpenPopup}
              className="h-8 text-xs gap-1.5 text-primary border-primary/30 hover:bg-primary/5"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{isNative ? "Open in App Browser" : "Open in Popup"}</span>
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
            onClick={handleDone}
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
              <Button variant="outline" onClick={handleDone} className="text-xs h-9">
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
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 mb-4 shadow-sm">
                  <AlertCircle className="h-8 w-8" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-foreground">
                  Easebuzz didn't load here
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-md mt-2 leading-relaxed">
                  Easebuzz security policies prevent rendering this portal inside an embedded frame. Please complete verification in the dedicated window.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button
                    onClick={handleOpenPopup}
                    className="bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm h-11 px-6 gap-2 shadow-sm font-bold"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {isNative ? "Open KYC Verification" : "Open KYC in popup"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleRefreshStatus}
                    disabled={refreshing}
                    className="h-11 text-xs sm:text-sm px-5 gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
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
                onLoad={handleIframeLoad}
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
