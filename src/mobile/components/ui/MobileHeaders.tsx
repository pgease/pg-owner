import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, Bell, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import pgeaseIconColor from "@/assets/pgease-icon-color.png";
import { useApp } from "@/context/AppContext";
import { useOwnerNotifications } from "@/hooks/useOwnerNotifications";
import { cn } from "@/lib/utils";

function isAndroidCapacitor(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as any).Capacitor;
  return Boolean(cap?.isNativePlatform?.() && cap?.getPlatform?.() === "android");
}

function headerTopPadding(): string {
  // On Android native, OwnerShell.java reserves system bar + cutout space natively on SwipeRefreshLayout;
  // env(safe-area-inset-top) is 0px on Android and handles iOS/PWA cleanly.
  return isAndroidCapacitor() ? "10px" : "calc(env(safe-area-inset-top, 0px) + 10px)";
}

type PgAvatarSource = {
  name?: string | null;
  photos?: Array<string | { url?: string | null }> | null;
} | null;

function resolvePgPhotoUrl(pg?: PgAvatarSource): string | null {
  const first = Array.isArray(pg?.photos) && pg.photos.length > 0 ? pg.photos[0] : null;
  if (!first) return null;
  if (typeof first === "string") return first;
  return typeof first.url === "string" ? first.url : null;
}

/**
 * R2: Reusable PG Avatar that shows the uploaded PG photo or falls back cleanly
 * to the PG Ease brand mark / initials on a crisp white tile (never blank).
 */
export function PgAvatar({
  pg,
  size = "sm",
  className,
}: {
  pg?: PgAvatarSource;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const photoUrl = resolvePgPhotoUrl(pg);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [photoUrl]);

  const sizeClass =
    size === "lg" ? "h-14 w-14 rounded-2xl" : size === "md" ? "h-11 w-11 rounded-xl" : "h-9 w-9 rounded-xl";

  if (photoUrl && !imgError) {
    return (
      <div
        className={cn(
          sizeClass,
          "bg-white border border-white/30 flex items-center justify-center shrink-0 overflow-hidden shadow-xs",
          className,
        )}
      >
        <img
          src={photoUrl}
          alt={pg?.name || "PG"}
          onError={() => setImgError(true)}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        sizeClass,
        "bg-white border border-white/30 flex items-center justify-center shrink-0 overflow-hidden p-1 shadow-xs",
        className,
      )}
    >
      <img src={pgeaseIconColor} alt={pg?.name || "PG Ease"} className="h-full w-full object-contain" />
    </div>
  );
}

/**
 * R3: Sticky 2-row global header for all 5 main tabs.
 * Row 1: Sticky PG avatar + PG switcher ({PG name} ▾ + address) + Notification Bell.
 * Row 2: Page title + optional subtitle + page actions (never concatenated into PG name).
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
      className={cn("ms-header-gradient text-white px-4 pb-3 sticky top-0 z-30 shadow-xs", className)}
      style={{ paddingTop: headerTopPadding() }}
    >
      {/* Row 1: Global Sticky PG Switcher + Bell */}
      <div className="flex items-center justify-between gap-2.5 min-h-[44px]">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <PgAvatar pg={selectedPg} size="sm" />
          {showPgSwitcher ? (
            <button
              type="button"
              onClick={() => setIsPgSwitcherOpen(true)}
              className="min-w-0 flex-1 text-left cursor-pointer min-h-[44px] flex flex-col justify-center"
              aria-label="Switch property"
            >
              <div className="flex items-center gap-1">
                <span className="text-[15px] font-semibold leading-tight truncate">
                  {selectedPg?.name ?? "Select PG"}
                </span>
                {canSwitch && <ChevronDown className="h-4 w-4 text-white/85 shrink-0" />}
              </div>
              <p className="text-[11px] text-white/80 truncate mt-0.5">
                {selectedPg?.address || "Tap to switch property"}
              </p>
            </button>
          ) : (
            <div className="min-w-0 flex-1">
              <span className="text-[15px] font-semibold leading-tight truncate block">
                {selectedPg?.name ?? "PG Ease Manager"}
              </span>
              {selectedPg?.address && (
                <p className="text-[11px] text-white/80 truncate mt-0.5">{selectedPg.address}</p>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => navigate("/notifications")}
          className="relative h-10 w-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white active:scale-95 transition-transform cursor-pointer shrink-0"
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

      {/* Row 2: Page Title + Page Actions */}
      {(title || rightActions) && (
        <div className="mt-2 pt-2 border-t border-white/15 flex items-center justify-between gap-2.5">
          <div className="min-w-0 flex-1">
            {title && <h1 className="text-[17px] font-semibold leading-tight truncate">{title}</h1>}
            {subtitle && <p className="text-[11px] text-white/80 truncate mt-0.5">{subtitle}</p>}
          </div>
          {rightActions && <div className="flex items-center gap-2 shrink-0">{rightActions}</div>}
        </div>
      )}

      {row2 && <div className="mt-2.5">{row2}</div>}
    </header>
  );
}

/**
 * R3: Sticky 2-row header for all pushed screens (SubHeader).
 * Row 1: PG avatar + PG switcher + Notification Bell.
 * Row 2: Back arrow + page title + optional subtitle + page actions.
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
  const { unreadCount } = useOwnerNotifications();
  const list = Array.isArray(properties) ? properties : [];
  const selectedPg = list.find((p) => p.id === selectedPgId);
  const canSwitch = list.length > 1;

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    navigate(-1);
  };

  return (
    <header
      className="ms-header-gradient text-white px-4 pb-3 sticky top-0 z-30 shadow-xs"
      style={{ paddingTop: headerTopPadding() }}
    >
      {/* Row 1: Global Sticky PG Switcher + Bell */}
      <div className="flex items-center justify-between gap-2.5 min-h-[40px]">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <PgAvatar pg={selectedPg} size="sm" />
          <button
            type="button"
            onClick={() => setIsPgSwitcherOpen(true)}
            className="min-w-0 flex-1 text-left cursor-pointer flex flex-col justify-center"
            aria-label="Switch property"
          >
            <div className="flex items-center gap-1">
              <span className="text-[14px] font-semibold leading-tight truncate">
                {selectedPg?.name ?? "Select PG"}
              </span>
              {canSwitch && <ChevronDown className="h-3.5 w-3.5 text-white/85 shrink-0" />}
            </div>
            {selectedPg?.address && (
              <p className="text-[11px] text-white/75 truncate">{selectedPg.address}</p>
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={() => navigate("/notifications")}
          className="relative h-9 w-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white active:scale-95 transition-transform cursor-pointer shrink-0"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-[var(--ms-error-icon)] text-white text-[10px] font-semibold flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Row 2: Back Arrow + Page Title + Actions */}
      <div className="mt-2 pt-2 border-t border-white/15 flex items-center justify-between gap-2.5 min-h-[40px]">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <button
            type="button"
            onClick={handleBack}
            className="h-9 w-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0 active:scale-95 transition-transform cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-[16px] font-semibold leading-tight truncate">{title}</h1>
            {subtitle && <p className="text-[11px] text-white/80 truncate mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {rightActions && <div className="flex items-center gap-2 shrink-0">{rightActions}</div>}
      </div>
    </header>
  );
}
