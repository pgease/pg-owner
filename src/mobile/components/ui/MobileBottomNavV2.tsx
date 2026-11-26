import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BedDouble, IndianRupee, LayoutGrid, Menu, Users } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { usePropertySummary } from "@/mobile/hooks/usePropertySummary";
import { cn } from "@/lib/utils";
import { shouldHideMobileTabBar } from "@/lib/mobileRoutes";

export type PrimaryTabId = "dashboard" | "mypg" | "tenants" | "rent" | "menu";

export function resolveActiveTab(pathname: string): PrimaryTabId {
  if (pathname === "/" || pathname === "/dashboard" || pathname === "/kpis") return "dashboard";
  if (pathname.startsWith("/my-pgs") || pathname.startsWith("/post-pg") || pathname.startsWith("/food") || pathname.startsWith("/nightout")) {
    return "mypg";
  }
  if (pathname.startsWith("/tenants") || pathname.startsWith("/leads")) return "tenants";
  if (pathname.startsWith("/rent-payments") || pathname.startsWith("/expenses")) return "rent";
  return "menu";
}

async function triggerLightHaptic() {
  try {
    const Haptics = (window as any).Capacitor?.Plugins?.Haptics;
    if (Haptics?.impact) {
      await Haptics.impact({ style: "LIGHT" });
    }
  } catch {
    // ignore on web
  }
}

export function MobileBottomNavV2() {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedPgId } = useApp();
  const { summary } = usePropertySummary(selectedPgId);

  if (shouldHideMobileTabBar(location.pathname)) return null;

  const activeTab = resolveActiveTab(location.pathname);

  const tabs: Array<{
    id: PrimaryTabId;
    label: string;
    to: string;
    icon: React.ElementType;
    badgeCount?: number;
    badgeBg?: string;
  }> = [
    { id: "dashboard", label: "Dashboard", to: "/dashboard", icon: LayoutGrid },
    { id: "mypg", label: "My PG", to: "/my-pgs", icon: BedDouble },
    {
      id: "tenants",
      label: "Tenants",
      to: "/tenants",
      icon: Users,
      badgeCount: summary.kycPendingTenants > 0 ? summary.kycPendingTenants : undefined,
      badgeBg: "bg-[var(--ms-pending-icon)]",
    },
    {
      id: "rent",
      label: "Rent",
      to: "/rent-payments",
      icon: IndianRupee,
      badgeCount: summary.unpaidTenantsCount > 0 ? summary.unpaidTenantsCount : undefined,
      badgeBg: "bg-[var(--ms-error-icon)]",
    },
    { id: "menu", label: "Menu", to: "/menu", icon: Menu },
  ];

  const handleTap = (tab: (typeof tabs)[number]) => {
    void triggerLightHaptic();
    if (activeTab === tab.id) {
      if (location.pathname !== tab.to) {
        navigate(tab.to);
      } else {
        const scroller = document.getElementById("main-content");
        scroller?.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }
    navigate(tab.to);
  };

  return (
    <nav
      aria-label="Primary Bottom Navigation"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      className="md:hidden fixed inset-x-0 bottom-0 z-40 bg-[var(--ms-card)] border-t border-[var(--ms-border)] shadow-[0_-4px_16px_rgba(0,0,0,0.05)] ms-chrome-no-select"
    >
      <div className="grid grid-cols-5 h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTap(tab)}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 min-h-[44px] transition-all duration-150 cursor-pointer",
                active ? "text-[var(--ms-brand-text)]" : "text-[var(--ms-ink-3)]",
              )}
            >
              {active && (
                <span className="absolute top-0 h-[3px] w-8 rounded-b-full bg-[var(--ms-brand-600)]" />
              )}
              <div className="relative">
                <Icon className={cn("h-5 w-5 transition-transform duration-150", active && "scale-105")} strokeWidth={active ? 2.3 : 1.8} />
                {tab.badgeCount !== undefined && (
                  <span
                    className={cn(
                      "absolute -top-1 -right-2 min-w-[14px] h-[14px] px-1 rounded-full text-white text-[9px] font-semibold flex items-center justify-center",
                      tab.badgeBg || "bg-[var(--ms-brand-600)]",
                    )}
                  >
                    {tab.badgeCount > 9 ? "9+" : tab.badgeCount}
                  </span>
                )}
              </div>
              <span className={cn("text-[11px] leading-none", active ? "font-semibold" : "font-medium")}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
