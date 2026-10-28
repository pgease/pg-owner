import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Bell } from "lucide-react";
import { getMobilePageTitle, getParentRoute, isMobileTabRoot } from "@/lib/mobileRoutes";
import { useOwnerNotifications } from "@/hooks/useOwnerNotifications";

export function MobileTopBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount } = useOwnerNotifications();
  const title = getMobilePageTitle(location.pathname);
  const showBack = !isMobileTabRoot(location.pathname);

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
      className="pgease-mobile-topbar md:hidden sticky top-0 z-30 bg-white border-b border-[#E2E6EA]"
      style={{ paddingTop: "var(--safe-top)" }}
    >
      <div className="relative flex h-12 items-center px-2">
        {showBack ? (
          <button
            type="button"
            onClick={goBack}
            className="flex h-11 w-11 items-center justify-center text-[#18212B] shrink-0"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        ) : (
          <span className="w-11 shrink-0" />
        )}
        <h1 className="absolute inset-x-14 truncate text-center text-[16px] font-semibold text-[#18212B]">{title}</h1>
        <button
          type="button"
          onClick={() => navigate("/notifications")}
          className="ml-auto relative flex h-11 w-11 items-center justify-center text-[#18212B] shrink-0"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 ? (
            <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-[#008080] text-white text-[10px] font-semibold leading-4 text-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </button>
      </div>
    </header>
  );
}
