import React, { useState, useEffect, useRef } from "react";
import { X, RefreshCw, ExternalLink, ShieldCheck, AlertCircle, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Capacitor, type PluginListenerHandle } from "@capacitor/core";
import { Browser } from "@capacitor/browser";

/**
 * Config flag: When false, skips iframe embed, opens popup / in-app browser directly,
 * and renders a "Waiting for KYC... Refresh status" screen.
 * When true, renders the iframe and displays a "Having trouble? Open in popup" banner
 * if still blank after 8s without unmounting the iframe.
 */
export const EASEBUZZ_KYC_EMBED = false;

/**
 * Native platform detection: (window as any).Capacitor?.isNativePlatform?.() first, then ?app=1.
 */
export function isCapacitorApp(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as any;
  if (typeof w.Capacitor?.isNativePlatform === "function" && w.Capacitor.isNativePlatform()) {
    return true;
  }
  const searchParams = new URLSearchParams(window.location.search);
  if (searchParams.get("app") === "1") {
    return true;
  }
  if (document.documentElement.classList.contains("pgease-native")) {
    return true;
  }
  return false;
}

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
  const [showTroubleBanner, setShowTroubleBanner] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasConfirmedLoadRef = useRef(false);
  const browserListenerRef = useRef<PluginListenerHandle | null>(null);
  const hasAutoOpenedRef = useRef(false);

  const removeBrowserListener = async () => {
    if (browserListenerRef.current) {
      try {
        await browserListenerRef.current.remove();
      } catch {
        /* ignore removal error */
      }
      browserListenerRef.current = null;
    }
  };

  const openExternalKyc = async (url: string) => {
    if (isCapacitorApp()) {
      try {
        await removeBrowserListener();
        browserListenerRef.current = await Browser.addListener("browserFinished", () => {
          onRefreshStatus?.();
        });
        await Browser.open({
          url,
          presentationStyle: "popover",
          toolbarColor: "#005045",
        });
        return;
      } catch (err) {
        // If Browser plugin fails, remove listener and fall back to centered popup
        await removeBrowserListener();
        openCenteredPopup(url);
        return;
      }
    }
    openCenteredPopup(url);
  };

  useEffect(() => {
    if (isOpen && kycUrl) {
      document.body.style.overflow = "hidden";

      if (!EASEBUZZ_KYC_EMBED) {
        // When embed is false: skip iframe, open popup / app browser once
        if (!hasAutoOpenedRef.current) {
          hasAutoOpenedRef.current = true;
          openExternalKyc(kycUrl);
        }
      } else {
        // When embed is true: keep iframe and watch 8s fallback
        setIframeLoading(true);
        setShowTroubleBanner(false);
        hasConfirmedLoadRef.current = false;

        loadTimeoutRef.current = setTimeout(() => {
          if (!hasConfirmedLoadRef.current) {
            setShowTroubleBanner(true);
            setIframeLoading(false);
          }
        }, 8000);
      }
    } else {
      document.body.style.overflow = "";
      hasAutoOpenedRef.current = false;
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    }

    return () => {
      document.body.style.overflow = "";
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
      removeBrowserListener();
    };
  }, [isOpen, kycUrl]);

  if (!isOpen) return null;

  const handleManualOpen = () => {
    openExternalKyc(kycUrl);
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
    await removeBrowserListener();
    if (onRefreshStatus) {
      try {
        await onRefreshStatus();
      } catch {
        /* ignore refresh error on close */
      }
    }
    onClose();
  };

  const handleIframeLoad = (e: React.SyntheticEvent<HTMLIFrameElement>) => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
    setIframeLoading(false);

    // If accessible and blank (e.g. about:blank or empty body due to framing blocks)
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
      // Cross-origin restriction is expected when external site actually loads
      isBlank = false;
    }

    if (isBlank) {
      setShowTroubleBanner(true);
    } else {
      hasConfirmedLoadRef.current = true;
      setShowTroubleBanner(false);
    }
  };

  const isNative = isCapacitorApp();

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
              <span className="hidden sm:inline">Refresh status</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleManualOpen}
            className="h-8 text-xs gap-1.5 text-primary border-primary/30 hover:bg-primary/5 font-semibold"
            title={isNative ? "Open KYC in app browser" : "Open KYC in popup window"}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isNative ? "Open in App Browser" : "Open in popup"}</span>
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
        {!EASEBUZZ_KYC_EMBED ? (
          /* Waiting for KYC... Refresh status screen (when EASEBUZZ_KYC_EMBED is false) */
          <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-white text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 mb-4 shadow-sm">
              <Clock className="h-8 w-8 animate-pulse text-teal-700" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-foreground">
              Waiting for KYC...
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mt-2 leading-relaxed">
              We opened the Easebuzz verification form in a dedicated {isNative ? "app browser" : "window"}. Complete the identity and bank verification steps, then click <strong>Refresh status</strong>.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-sm">
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm h-11 px-6 gap-2 shadow-sm"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "Checking status…" : "Refresh status"}
              </Button>
              <Button
                variant="outline"
                onClick={handleManualOpen}
                className="w-full sm:w-auto h-11 text-sm px-5 gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                {isNative ? "Re-open verification" : "Re-open popup"}
              </Button>
            </div>
          </div>
        ) : (
          /* Embedded Iframe view (when EASEBUZZ_KYC_EMBED is true) */
          <>
            {/* Loading Spinner */}
            {iframeLoading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/95">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                <p className="text-sm font-semibold text-foreground">Loading Easebuzz KYC Portal…</p>
                <p className="text-xs text-muted-foreground mt-1">Connecting to secure gateway server</p>
              </div>
            )}

            {/* Having trouble banner (shown after 8s or if blank, WITHOUT unmounting iframe) */}
            {showTroubleBanner && (
              <div className="absolute top-3 inset-x-4 z-20 rounded-xl border border-amber-300 bg-amber-50/95 p-3.5 shadow-md backdrop-blur-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>
                    Having trouble? Security restrictions may block embedded verification.
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={handleManualOpen}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-8 px-4 gap-1.5 shrink-0 self-end sm:self-auto"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {isNative ? "Open in App Browser" : "Open in popup"}
                </Button>
              </div>
            )}

            <iframe
              src={kycUrl}
              title="Easebuzz Submerchant KYC"
              className="w-full h-full border-0 bg-white"
              allow="camera; microphone; geolocation; clipboard-write; payment"
              onLoad={handleIframeLoad}
              onError={() => {
                setIframeLoading(false);
                setShowTroubleBanner(true);
              }}
            />
          </>
        )}
      </div>

      {/* Footer bar */}
      <footer className="px-4 py-2.5 bg-white border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-muted-foreground shrink-0">
        <span>
          Complete KYC in the {EASEBUZZ_KYC_EMBED ? "form above or popup" : "opened window"}, then click <strong>Refresh status</strong>.
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
