import React, { useState, useEffect } from "react";
import { X, RefreshCw, ExternalLink, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function openCenteredPopup(url: string, title = "EasebuzzKYC", w = 920, h = 820) {
  const dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : window.screenX;
  const dualScreenTop = window.screenTop !== undefined ? window.screenTop : window.screenY;

  const width = window.innerWidth || document.documentElement.clientWidth || screen.width;
  const height = window.innerHeight || document.documentElement.clientHeight || screen.height;

  const left = Math.max(0, width / 2 - w / 2 + dualScreenLeft);
  const top = Math.max(0, height / 2 - h / 2 + dualScreenTop);

  const newWindow = window.open(
    url,
    title,
    `scrollbars=yes,resizable=yes,width=${w},height=${h},top=${top},left=${left}`
  );

  if (newWindow && window.focus) {
    newWindow.focus();
  }
  return newWindow;
}

interface PaymentKycModalProps {
  isOpen: boolean;
  onClose: () => void;
  kycUrl: string;
  onRefreshStatus?: () => Promise<void> | void;
}

export const PaymentKycModal: React.FC<PaymentKycModalProps> = ({
  isOpen,
  onClose,
  kycUrl,
  onRefreshStatus,
}) => {
  const [iframeLoading, setIframeLoading] = useState(true);
  const [framingBlocked, setFramingBlocked] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIframeLoading(true);
      setFramingBlocked(false);

      // Lock body scroll
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, kycUrl]);

  if (!isOpen) return null;

  const handleManualPopup = () => {
    openCenteredPopup(kycUrl);
  };

  const handleRefresh = async () => {
    if (onRefreshStatus) {
      setRefreshing(true);
      try {
        await onRefreshStatus();
      } finally {
        setRefreshing(false);
      }
    }
  };

  const handleClose = async () => {
    if (onRefreshStatus) {
      try {
        await onRefreshStatus();
      } catch {
        /* ignore refresh error on close */
      }
    }
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex flex-col bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200"
    >
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 bg-white border-b border-border shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700 border border-teal-200">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
              Easebuzz KYC Verification
              <span className="hidden sm:inline-block text-[11px] font-medium text-muted-foreground px-2 py-0.5 rounded-full bg-slate-100">
                In-Portal Gateway Setup
              </span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Complete your business verification to activate direct bank settlements.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRefreshStatus && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="h-8 text-xs gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh Status</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleManualPopup}
            className="h-8 text-xs gap-1.5 text-primary border-primary/30 hover:bg-primary/5"
            title="Open KYC in centered popup window if embedded view is restricted"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Open in Popup</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            aria-label="Close KYC modal"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main body */}
      <div className="relative flex-1 w-full bg-slate-100 overflow-hidden">
        {/* Loading Spinner */}
        {iframeLoading && !framingBlocked && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/95">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-sm font-semibold text-foreground">Loading Easebuzz KYC Portal…</p>
            <p className="text-xs text-muted-foreground mt-1">Connecting to secure gateway server</p>
          </div>
        )}

        {/* Framing Blocked Fallback */}
        {framingBlocked ? (
          <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-white text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 mb-4">
              <AlertCircle className="h-7 w-7" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-foreground">
              Embedded Verification Restricted
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mt-1.5 leading-relaxed">
              Easebuzz's security policy requires this verification form to be completed in a dedicated window.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Button
                onClick={handleManualPopup}
                className="bg-primary hover:bg-primary/90 text-white font-bold text-xs sm:text-sm h-10 px-5 gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Open KYC in Popup Window
              </Button>
              {onRefreshStatus && (
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="h-10 text-xs sm:text-sm px-4 gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                  Refresh Status
                </Button>
              )}
            </div>
          </div>
        ) : (
          <iframe
            src={kycUrl}
            title="Easebuzz Submerchant KYC"
            className="w-full h-full border-0 bg-white"
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

      {/* Footer bar */}
      <footer className="px-4 py-2.5 bg-white border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-muted-foreground shrink-0">
        <span>
          Complete KYC in the form above or in the popup, then click <strong>Refresh status</strong>.
        </span>
        <Button
          size="sm"
          onClick={handleClose}
          className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs h-8 px-4 self-end sm:self-auto"
        >
          Close & Refresh
        </Button>
      </footer>
    </div>
  );
};
