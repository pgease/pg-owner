import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Building2,
  IndianRupee,
  Menu as MenuIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { shouldHideMobileTabBar } from "@/lib/mobileRoutes";
import { useApp } from "@/context/AppContext";

const TABS = [
  { id: "dashboard", to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "tenants", to: "/tenants", label: "Tenants", icon: Users },
  { id: "rooms", to: "/my-pgs/structure", label: "Rooms", icon: Building2 },
  { id: "payments", to: "/rent-payments", label: "Payments", icon: IndianRupee },
];

export function MobileBottomNav() {
  const location = useLocation();
  const { isOwnerDrawerOpen, setIsOwnerDrawerOpen } = useApp();

  if (shouldHideMobileTabBar(location.pathname)) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E2E6EA] bg-white md:hidden shadow-[0_-2px_10px_rgba(0,0,0,0.03)]"
      style={{ paddingBottom: "var(--safe-bottom)" }}
      aria-label="Primary Mobile Navigation"
    >
      <div className="grid grid-cols-5 h-14">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            location.pathname === tab.to ||
            (tab.id === "dashboard" && location.pathname === "/") ||
            (tab.id === "rooms" && location.pathname.startsWith("/my-pgs")) ||
            (tab.id === "tenants" && location.pathname.startsWith("/tenants")) ||
            (tab.id === "payments" && location.pathname.startsWith("/rent-payments"));

          return (
            <NavLink
              key={tab.id}
              to={tab.to}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                isActive ? "text-[#008080] font-bold" : "text-[#636363] hover:text-[#101010]"
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.3 : 1.8} />
              <span>{tab.label}</span>
            </NavLink>
          );
        })}

        <button
          type="button"
          onClick={() => setIsOwnerDrawerOpen(true)}
          className={cn(
            "flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors cursor-pointer",
            isOwnerDrawerOpen ? "text-[#008080] font-bold" : "text-[#636363] hover:text-[#101010]"
          )}
          aria-label="Open Navigation Menu"
        >
          <MenuIcon className="h-5 w-5" strokeWidth={isOwnerDrawerOpen ? 2.3 : 1.8} />
          <span>Menu</span>
        </button>
      </div>
    </nav>
  );
}
