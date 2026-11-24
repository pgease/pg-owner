import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Bell, Menu } from "lucide-react";
import { getMobilePageTitle, getParentRoute, isMobileTabRoot } from "@/lib/mobileRoutes";
import { useOwnerNotifications } from "@/hooks/useOwnerNotifications";
import { useEntitlements } from "@/hooks/useEntitlements";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";

export function MobileTopBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount } = useOwnerNotifications();
  const { isPro, isLite, isTrial, isExpired, daysRemaining, isLoading } = useEntitlements();
  const { setIsOwnerDrawerOpen } = useApp();

  const title = getMobilePageTitle(location.pathname);
  const showBack = !isMobileTabRoot(location.pathname);

  const planChip = (() => {
    if (isLoading) return null;
    if (isExpired) {
      return {
        label: "Expired",
        className: "bg-rose-100 text-rose-700 border border-rose-300",
      };
    }
    const days = Math.max(0, daysRemaining);
    if (isTrial) {
      return {
        label: `Trial · ${days}d`,
        className: "bg-amber-100 text-amber-800 border border-amber-300",
      };
    }
    if (isPro) {
      return {
        label: "Pro",
        className: "bg-teal-100 text-teal-800 border border-teal-300",
      };
    }
    if (isLite) {
      return {
        label: "Lite",
        className: "bg-slate-100 text-slate-700 border border-slate-300",
      };
    }
    return null;
  })();

  const goBack = () => {
    const idx = typeof window !== "undefined" ? window.history.state?.idx : undefined;
    if (typeof idx === "number" && idx > 0) {
      navigate(-1);
      return;
    }
    navigate(getParentRoute(location.pathname));
  };

  return (
    <header
      className="pgease-mobile-topbar md:hidden sticky top-0 z-30 bg-white border-b border-[#E2E6EA] shadow-2xs"
      style={{ paddingTop: "var(--safe-top)" }}
    >
      <div className="relative flex h-14 items-center justify-between px-3">
        {/* Left: Back button or Hamburger menu */}
        <div className="flex items-center">
          {showBack ? (
            <button
              type="button"
              onClick={goBack}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50 text-[#18212B] hover:bg-slate-100 transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsOwnerDrawerOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50 text-[#18212B] hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Open navigation drawer"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Center: Title + Plan Chip */}
        <div className="flex items-center gap-1.5 min-w-0 max-w-[60%] justify-center">
          <h1 className="truncate text-[15px] font-bold text-[#18212B]">{title}</h1>
          {planChip && (
            <span
              className={cn(
                "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0",
                planChip.className
              )}
            >
              {planChip.label}
            </span>
          )}
        </div>

        {/* Right: 40dp Notification bell */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => navigate("/notifications")}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50 text-[#18212B] hover:bg-slate-100 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 ? (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-[#008080] text-white text-[10px] font-semibold leading-4 text-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </button>
        </div>
      </div>
    </header>
  );
}
