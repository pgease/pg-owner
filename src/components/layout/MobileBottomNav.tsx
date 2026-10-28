import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Building2, Home, IndianRupee, LayoutGrid, Users, X, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { authStorage } from "@/api/http";
import { getActiveMobileTab, shouldHideMobileTabBar } from "@/lib/mobileRoutes";

const TABS = [
  { id: "home" as const, to: "/dashboard", label: "Home", icon: Home },
  { id: "tenants" as const, to: "/tenants", label: "Tenants", icon: Users },
  { id: "rent" as const, to: "/rent-payments", label: "Rent", icon: IndianRupee },
  { id: "mypg" as const, to: "/my-pgs", label: "My PG", icon: Building2 },
];

const MENU_LINKS = [
  { to: "/complaints", label: "Complaints" },
  { to: "/tenants/kyc", label: "KYC" },
  { to: "/food", label: "Food" },
  { to: "/team", label: "Staff" },
  { to: "/reports", label: "Reports" },
  { to: "/expenses", label: "Expenses" },
  { to: "/plans", label: "Plans" },
  { to: "/settings", label: "Settings" },
  { to: "/support", label: "Support" },
];

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  if (shouldHideMobileTabBar(location.pathname)) return null;

  const active = menuOpen ? "menu" : getActiveMobileTab(location.pathname);

  const handleLogout = () => {
    authStorage.clear();
    setMenuOpen(false);
    navigate("/login");
  };

  return (
    <>
      {menuOpen ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-white md:hidden" role="dialog" aria-label="Menu">
          <div className="flex items-center justify-between px-4 pt-[calc(var(--safe-top)+12px)] pb-3 border-b border-[#E2E6EA]">
            <p className="text-[17px] font-semibold text-[#18212B]">Menu</p>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="flex h-11 w-11 items-center justify-center rounded-full text-[#18212B]"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-2">
            {MENU_LINKS.map((link) => (
              <button
                key={link.to}
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  navigate(link.to);
                }}
                className="flex w-full items-center min-h-11 px-3 py-3 text-left text-[16px] text-[#18212B] rounded-[12px] hover:bg-[#F6F7F8]"
              >
                {link.label}
              </button>
            ))}
            <button
              type="button"
              onClick={handleLogout}
              className="mt-2 flex w-full items-center gap-2 min-h-11 px-3 py-3 text-left text-[16px] text-[#B42318] rounded-[12px] hover:bg-[#FEF1F0]"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </nav>
        </div>
      ) : null}

      <nav
        className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white border-t border-[#E2E6EA]"
        style={{ paddingBottom: "var(--safe-bottom)" }}
        aria-label="Primary"
      >
        <div className="grid grid-cols-5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = active === tab.id;
            return (
              <NavLink
                key={tab.id}
                to={tab.to}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 min-h-[44px] h-14 text-[11px] font-medium",
                  isActive ? "text-[#008080]" : "text-[#636363]",
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.4 : 1.8} />
                {tab.label}
              </NavLink>
            );
          })}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 min-h-[44px] h-14 text-[11px] font-medium",
              active === "menu" ? "text-[#008080]" : "text-[#636363]",
            )}
          >
            <LayoutGrid className="h-5 w-5" strokeWidth={active === "menu" ? 2.4 : 1.8} />
            Menu
          </button>
        </div>
      </nav>
    </>
  );
}
