import React from "react";
import { ArrowLeft, Bell, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import pgeaseIconWhite from "@/assets/pgease-icon-white.png";
import { useApp } from "@/context/AppContext";
import { useOwnerNotifications } from "@/hooks/useOwnerNotifications";
import { cn } from "@/lib/utils";

/**
 * Unified top-level header for all 5 main tabs (Dashboard, My PG, Tenants, Rent, Menu).
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
  const selectedPg = list.find((p) => p.id === selectedPgId);
  const canSwitch = list.length > 1;

  return (
    <header
      className={cn("ms-header-gradient text-white px-4 pb-4", className)}
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)" }}
    >
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="h-10 w-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0 overflow-hidden p-1.5">
            <img src={pgeaseIconWhite} alt="PG Ease" className="h-full w-full object-contain" />
          </div>
          {showPgSwitcher ? (
            <button
              type="button"
              onClick={() => setIsPgSwitcherOpen(true)}
              className="min-w-0 flex-1 text-left cursor-pointer"
              aria-label="Switch property"
            >
              <div className="flex items-center gap-1">
                <span className="text-[17px] font-semibold leading-tight truncate">
                  {selectedPg?.name ?? "Select PG"}
                </span>
                {canSwitch && <ChevronDown className="h-4 w-4 text-white/85 shrink-0" />}
              </div>
              <p className="text-[12px] text-white/80 truncate mt-0.5">
                {selectedPg?.address || "Manage your property"}
              </p>
            </button>
          ) : (
            <div className="min-w-0 flex-1">
              <h1 className="text-[19px] font-semibold leading-tight truncate">{title}</h1>
              {subtitle && <p className="text-[12px] text-white/80 truncate mt-0.5">{subtitle}</p>}
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
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--ms-error)] text-white text-[10px] font-semibold flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {row2 && <div className="mt-3">{row2}</div>}
    </header>
  );
}

/**
 * Unified header for all pushed screens (SubHeader).
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
  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    navigate(-1);
  };

  return (
    <header
      className="ms-header-gradient text-white px-4 pb-3.5 sticky top-0 z-30"
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 10px)" }}
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
            <h1 className="text-[18px] font-semibold leading-tight truncate">{title}</h1>
            {subtitle && <p className="text-[12px] text-white/80 truncate">{subtitle}</p>}
          </div>
        </div>
        {rightActions && <div className="flex items-center gap-2 shrink-0">{rightActions}</div>}
      </div>
    </header>
  );
}
