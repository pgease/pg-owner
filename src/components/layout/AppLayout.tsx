import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import AppSidebar from "./AppSidebar";
import AppHeader from "./AppHeader";
import { MobileBottomNav } from "./MobileBottomNav";
import { MobileTopBar } from "./MobileTopBar";
import { SubscriptionBanner } from "./SubscriptionBanner";
import StaffExpiredLockout from "./StaffExpiredLockout";
import { authStorage } from "@/api/http";
import { useEntitlements } from "@/hooks/useEntitlements";
import { shouldHideMobileTabBar } from "@/lib/mobileRoutes";

interface AppLayoutProps {
  children: React.ReactNode;
}

const COLLAPSE_KEY = "pgease_sidebar_collapsed";

function readCollapsed(): boolean {
  try {
    const saved = localStorage.getItem(COLLAPSE_KEY);
    if (saved !== null) {
      return saved === "true";
    }
    // Auto-collapse on tablet screens (< 1024px) so content has ample room
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const [collapsed, setCollapsed] = useState<boolean>(readCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { isExpired, isLoading } = useEntitlements();
  const isStaff = authStorage.isStaff();
  const isMobileDashboardHome =
    location.pathname === "/dashboard" || location.pathname === "/kpis" || location.pathname === "/";

  // If user is staff and the owner's subscription has expired, enforce full operational lockout.
  if (!isLoading && isExpired && isStaff) {
    return <StaffExpiredLockout />;
  }

  // Auto-collapse sidebar on tablet width on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && window.innerWidth < 1024) {
        setCollapsed(true);
      }
    };
    if (window.innerWidth >= 768 && window.innerWidth < 1024 && localStorage.getItem(COLLAPSE_KEY) === null) {
      setCollapsed(true);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Persist the collapse preference and close the mobile drawer on navigation.
  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, String(collapsed));
    } catch {
      // ignore
    }
  }, [collapsed]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="h-dvh w-full overflow-hidden overflow-x-hidden flex bg-gradient-to-b from-[#005555] via-[#005050] to-[#003d3d]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-[6px] focus:bg-[#008080] focus:px-3 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to main content
      </a>
      <AppSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex-1 h-dvh flex flex-col min-w-0 overflow-hidden overflow-x-hidden">
        <AppHeader
          onMenuToggle={() => setMobileOpen((v) => !v)}
          onSidebarToggle={() => setCollapsed((v) => !v)}
          isSidebarCollapsed={collapsed}
        />
        {isMobileDashboardHome ? null : <MobileTopBar />}
        <SubscriptionBanner />
        <main
          id="main-content"
          className={cn(
            "pgease-app-main flex-1 overflow-y-auto overflow-x-hidden overscroll-contain dark:bg-slate-950 md:rounded-tl-[32px] md:shadow-xl transition-colors",
            isMobileDashboardHome
              ? "bg-white p-0 md:bg-[#F8FAFC] md:p-6"
              : "bg-[#F8FAFC] p-3 sm:p-4 md:p-6",
            shouldHideMobileTabBar(location.pathname)
              ? "pb-6 md:pb-28"
              : "pb-[calc(72px+var(--safe-bottom))] md:pb-28",
          )}
        >
          <div className="mx-auto w-full">{children}</div>
        </main>
        <MobileBottomNav />
      </div>
    </div>
  );
};

export default AppLayout;
