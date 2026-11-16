import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Building2,
  Home,
  IndianRupee,
  LayoutGrid,
  Users,
  X,
  LogOut,
  ArrowLeft,
  PlayCircle,
  Package,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { authStorage } from "@/api/http";
import { getActiveMobileTab, shouldHideMobileTabBar } from "@/lib/mobileRoutes";
import { useTutorial } from "@/context/TutorialContext";

const TABS = [
  { id: "home" as const, to: "/dashboard", label: "Home", icon: Home },
  { id: "mypg" as const, to: "/my-pgs", label: "My PG", icon: Building2 },
  { id: "tenants" as const, to: "/tenants", label: "Tenants", icon: Users },
  { id: "rent" as const, to: "/rent-payments", label: "Rent", icon: IndianRupee },
];

const MENU_LINKS = [
  { to: "/settings", label: "Profile" },
  { to: "/settings/inventory", label: "Inventory" },
  { to: "/group-chat", label: "Group Chat (Soon)" },
  { to: "/complaints", label: "Complaints" },
  { to: "/tenants/guests", label: "Guest Requests & Check-in" },
  { to: "/nightout", label: "Night Out Logs" },
  { to: "/tenants/kyc", label: "KYC & Agreements" },
  { to: "/food", label: "Food & Meals" },
  { to: "/team", label: "Staff & Permissions" },
  { to: "/reports", label: "Reports" },
  { to: "/expenses", label: "Expenses" },
  { to: "/plans", label: "Plans & Billing" },
  { to: "#help", label: "Help & Video Tutorials", isHelp: true },
  { to: "https://help.pgease.com", label: "Help Center (help.pgease.com)", isExternal: true },
  { to: "/support", label: "Contact Support" },
];

const HELP_TOPICS = [
  { key: "tenant_add", title: "Add Tenant", desc: "How to add and onboard tenants" },
  { key: "rent_collection", title: "Rent Collection", desc: "Direct UPI intent and manual verify" },
  { key: "room_management", title: "Property Setup", desc: "Rooms, floors & bed allocation" },
  { key: "kyc_verification", title: "KYC & Agreements", desc: "Aadhaar DigiLocker & digital agreements" },
  { key: "staff_management", title: "Staff & Wardens", desc: "Roles, permissions and warden access" },
  { key: "expense_tracker", title: "Expenses & Profit", desc: "Record PG expenses and monthly profits" },
  { key: "electricity_billing", title: "Electricity Billing", desc: "Meter readings & automated tenant splits" },
  { key: "complaints_resolution", title: "Complaints & Maintenance", desc: "Service requests and resolutions" },
  { key: "public_listing", title: "Public Listing", desc: "Publish PG online & capture direct leads" },
  { key: "post_your_pg_in_live", title: "Post Your PG Live", desc: "Launch your PG live on PG Ease" },
];

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showHelpTopics, setShowHelpTopics] = useState(false);
  const { openTutorial } = useTutorial();

  if (shouldHideMobileTabBar(location.pathname)) return null;

  const active = menuOpen ? "menu" : getActiveMobileTab(location.pathname);

  const handleLogout = () => {
    authStorage.clear();
    setMenuOpen(false);
    setShowHelpTopics(false);
    navigate("/login");
  };

  const handleOpenHelpTopic = (key: string) => {
    setMenuOpen(false);
    setShowHelpTopics(false);
    void openTutorial(key);
  };

  return (
    <>
      {menuOpen ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-white md:hidden" role="dialog" aria-label="Menu">
          <div className="flex items-center justify-between px-4 pt-[calc(var(--safe-top)+12px)] pb-3 border-b border-[#E2E6EA]">
            {showHelpTopics ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowHelpTopics(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[#18212B] hover:bg-slate-100"
                  aria-label="Back to menu"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <p className="text-[17px] font-semibold text-[#18212B]">Help & Video Tutorials</p>
              </div>
            ) : (
              <p className="text-[17px] font-semibold text-[#18212B]">Menu</p>
            )}
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setShowHelpTopics(false);
              }}
              className="flex h-11 w-11 items-center justify-center rounded-full text-[#18212B]"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-2">
            {showHelpTopics ? (
              <div className="space-y-1.5 pb-6">
                <p className="px-3 pt-1 pb-2 text-xs text-slate-500">
                  Select a topic to watch the step-by-step video guide.
                </p>
                {HELP_TOPICS.map((topic) => (
                  <button
                    key={topic.key}
                    type="button"
                    onClick={() => handleOpenHelpTopic(topic.key)}
                    className="flex w-full items-center justify-between p-3 text-left rounded-xl hover:bg-slate-50 border border-slate-100"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-sm font-medium text-[#18212B]">{topic.title}</p>
                      <p className="text-xs text-slate-500 truncate">{topic.desc}</p>
                    </div>
                    <PlayCircle className="h-5 w-5 text-[#008080] shrink-0" />
                  </button>
                ))}
                <div className="pt-3">
                  <a
                    href="https://help.pgease.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-1.5 p-3 text-xs font-semibold text-[#008080] bg-teal-50 rounded-xl hover:bg-teal-100"
                  >
                    Visit help.pgease.com for full documentation
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            ) : (
              <>
                {MENU_LINKS.map((link) => {
                  if (link.isHelp) {
                    return (
                      <button
                        key={link.to}
                        type="button"
                        onClick={() => setShowHelpTopics(true)}
                        className="flex w-full items-center justify-between min-h-11 px-3 py-3 text-left text-[16px] text-[#101010] rounded-[16px] hover:bg-[#F5F5F5]"
                      >
                        <span className="flex items-center gap-2.5">
                          <HelpCircle className="h-4 w-4 text-[#008080]" />
                          <span>{link.label}</span>
                        </span>
                        <span className="text-xs text-[#008080] font-semibold">Videos ›</span>
                      </button>
                    );
                  }
                  if (link.isExternal) {
                    return (
                      <a
                        key={link.to}
                        href={link.to}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setMenuOpen(false)}
                        className="flex w-full items-center justify-between min-h-11 px-3 py-3 text-left text-[16px] text-[#101010] rounded-[16px] hover:bg-[#F5F5F5]"
                      >
                        <span>{link.label}</span>
                        <span className="text-xs text-[#008080] font-bold">↗</span>
                      </a>
                    );
                  }
                  return (
                    <button
                      key={link.to}
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        navigate(link.to);
                      }}
                      className="flex w-full items-center min-h-11 px-3 py-3 text-left text-[16px] text-[#101010] rounded-[16px] hover:bg-[#F5F5F5]"
                    >
                      {link.label === "Inventory" ? (
                        <span className="flex items-center gap-2.5">
                          <Package className="h-4 w-4 text-[#636363]" />
                          <span>{link.label}</span>
                        </span>
                      ) : (
                        link.label
                      )}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-2 flex w-full items-center gap-2 min-h-11 px-3 py-3 text-left text-[16px] text-[#B42318] rounded-[12px] hover:bg-[#FEF1F0]"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </>
            )}
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
                onClick={() => {
                  setMenuOpen(false);
                  setShowHelpTopics(false);
                }}
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
            onClick={() => {
              setShowHelpTopics(false);
              setMenuOpen(true);
            }}
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
