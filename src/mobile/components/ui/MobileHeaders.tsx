import React, { useRef } from "react";
import { ArrowLeft, Bell, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import pgeaseIconWhite from "@/assets/pgease-icon-white.png";
import { useApp } from "@/context/AppContext";
import { useOwnerNotifications } from "@/hooks/useOwnerNotifications";
import { cn } from "@/lib/utils";

function isAndroidCapacitor(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as any).Capacitor;
  return Boolean(cap?.isNativePlatform?.() && cap?.getPlatform?.() === "android");
}

function headerTopPadding(): string {
  // On Android native, SystemBarStyling.padForSystemBars already clears the status bar;
  // applying env(safe-area-inset-top) again caused the ~48px double gap.
  return isAndroidCapacitor() ? "10px" : "calc(env(safe-area-inset-top, 0px) + 10px)";
}

/**
 * Unified compact teal-gradient header for all 5 main tabs.
 * Always includes the global PG switcher (C3) and keeps last PG name during refetch.
 */
export function MobileAppHeader({
  title,
  subtitle,
  showPgSwitcher = true,
  rightActions,
  row2,
  className,
}: {
  title?: string;
  subtitle?: string;
  showPgSwitcher?: boolean;
  rightActions?: React.ReactNode;
  row2?: React.ReactNode;
  className?: string;
}) {
  const navigate = useNavigate();
  const { properties, selectedPgId, setIsPgSwitcherOpen } = useApp();
  const { unreadCount } = useOwnerNotifications();
  const list = Array.isArray(properties) ? properties : [];
  const foundPg = list.find((p) => p.id === selectedPgId);

  const lastPgRef = useRef(foundPg);
  if (foundPg) lastPgRef.current = foundPg;
  const selectedPg = foundPg ?? lastPgRef.current;

  const canSwitch = list.length > 1;

  return (
    <header
      className={cn("ms-header-gradient text-white px-4 pb-3.5", className)}
      style={{ paddingTop: headerTopPadding() }}
    >
      <div className="flex items-center justify-between gap-2.5 min-h-[44px]">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="h-9 w-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0 overflow-hidden p-1.5">
            <img src={pgeaseIconWhite} alt="PG Ease" className="h-full w-full object-contain" />
          </div>
          {showPgSwitcher ? (
            <button
              type="button"
              onClick={() => setIsPgSwitcherOpen(true)}
              className="min-w-0 flex-1 text-left cursor-pointer min-h-[44px] flex flex-col justify-center"
              aria-label="Switch property"
            >
              <div className="flex items-center gap-1">
                <span className="text-[16px] font-semibold leading-tight truncate">
                  {title ? `${title} · ${selectedPg?.name ?? "PG"}` : (selectedPg?.name ?? "Select PG")}
                </span>
                {canSwitch && <ChevronDown className="h-4 w-4 text-white/85 shrink-0" />}
              </div>
              <p className="text-[11px] text-white/80 truncate mt-0.5">
                {subtitle ?? (selectedPg?.address || "Tap to switch property")}
              </p>
            </button>
          ) : (
            <div className="min-w-0 flex-1">
              <h1 className="text-[18px] font-semibold leading-tight truncate">{title}</h1>
              {subtitle && <p className="text-[11px] text-white/80 truncate mt-0.5">{subtitle}</p>}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {rightActions}
          <button
            type="button"
            onClick={() => navigate("/notifications")}
            className="relative h-10 w-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white active:scale-95 transition-transform cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--ms-error-icon)] text-white text-[10px] font-semibold flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {row2 && <div className="mt-2.5">{row2}</div>}
    </header>
  );
}

/**
 * Unified compact header for all pushed screens (SubHeader) with global PG switcher pill (C3).
 */
export function MobileSubHeader({
  title,
  subtitle,
  onBack,
  rightActions,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightActions?: React.ReactNode;
}) {
  const navigate = useNavigate();
  const { properties, selectedPgId, setIsPgSwitcherOpen } = useApp();
  const list = Array.isArray(properties) ? properties : [];
  const selectedPg = list.find((p) => p.id === selectedPgId);

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    navigate(-1);
  };

  return (
    <header
      className="ms-header-gradient text-white px-4 pb-3 sticky top-0 z-30"
      style={{ paddingTop: headerTopPadding() }}
    >
      <div className="flex items-center justify-between gap-2.5 min-h-[44px]">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <button
            type="button"
            onClick={handleBack}
            className="h-10 w-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0 active:scale-95 transition-transform cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-[17px] font-semibold leading-tight truncate">{title}</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              {selectedPg && (
                <button
                  type="button"
                  onClick={() => setIsPgSwitcherOpen(true)}
                  className="inline-flex items-center gap-1 text-[11px] text-white/85 truncate max-w-[190px] cursor-pointer"
                >
                  <span className="truncate">{selectedPg.name}</span>
                  {list.length > 1 && <ChevronDown className="h-3 w-3 shrink-0" />}
                </button>
              )}
              {subtitle && <span className="text-[11px] text-white/75 truncate">· {subtitle}</span>}
            </div>
          </div>
        </div>
        {rightActions && <div className="flex items-center gap-2 shrink-0">{rightActions}</div>}
      </div>
    </header>
  );
}
