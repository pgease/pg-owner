import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Building2,
  Check,
  Home,
  IndianRupee,
  LayoutGrid,
  Users,
  X,
  LogOut,
  ArrowLeft,
  PlayCircle,
  HelpCircle,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { authStorage } from "@/api/http";
import { getActiveMobileTab, shouldHideMobileTabBar } from "@/lib/mobileRoutes";
import { useTutorial } from "@/context/TutorialContext";
import { useApp } from "@/context/AppContext";
import { usePermissions } from "@/context/PermissionContext";
import { NAV_ITEMS, type NavChild, type NavItem } from "@/lib/ownerNav";

const TABS = [
  { id: "home" as const, to: "/dashboard", label: "Home", icon: Home },
  { id: "mypg" as const, to: "/my-pgs", label: "My PG", icon: Building2 },
  { id: "tenants" as const, to: "/tenants", label: "Tenants", icon: Users },
  { id: "rent" as const, to: "/rent-payments", label: "Rent", icon: IndianRupee },
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

function childVisible(child: NavChild, isOwner: boolean) {
  if (child.ownerOnly && !isOwner) return false;
  return true;
}

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showHelpTopics, setShowHelpTopics] = useState(false);
  const { openTutorial } = useTutorial();
  const { properties, selectedPgId, setSelectedPgId } = useApp();
  const { isOwner } = usePermissions();
  const list = Array.isArray(properties) ? properties : [];
  const selectedPg = list.find((p) => p.id === selectedPgId);

  useEffect(() => {
    if (!menuOpen) return;
    const previous = window.history.state;
    window.history.pushState({ ...(previous || {}), pgeaseMenu: true }, "");
    let closedByPop = false;
    const onPop = () => {
      closedByPop = true;
      setMenuOpen(false);
      setShowHelpTopics(false);
    };
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      if (!closedByPop && window.history.state?.pgeaseMenu) {
        window.history.back();
      }
    };
  }, [menuOpen]);

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

  const go = (url: string) => {
    setMenuOpen(false);
    setShowHelpTopics(false);
    navigate(url);
  };

  const renderChild = (child: NavChild) => {
    if (!childVisible(child, isOwner)) return null;
    const current = location.pathname === child.url;
    if (child.isExternal) {
      return (
        <a
          key={child.url}
          href={child.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setMenuOpen(false)}
          className="flex min-h-11 items-center justify-between rounded-xl px-3 py-2.5 text-left text-[15px] text-[#101010] hover:bg-[#F5F5F5]"
        >
          <span>{child.title}</span>
          <ExternalLink className="h-4 w-4 text-[#008080]" />
        </a>
      );
    }
    return (
      <button
        key={child.url + child.title}
        type="button"
        onClick={() => go(child.url)}
        className={cn(
          "flex min-h-11 w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[15px]",
          current ? "bg-[#E8F4F4] font-semibold text-[#008080]" : "text-[#101010] hover:bg-[#F5F5F5]",
        )}
      >
        <span className="truncate">{child.title}</span>
        <span className="flex items-center gap-1.5 shrink-0">
          {child.badge ? (
            <span className="rounded-full bg-[#E8F4F4] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#008080]">
              {child.badge}
            </span>
          ) : null}
          <ChevronRight className="h-4 w-4 text-[#9E9E9E]" />
        </span>
      </button>
    );
  };

  const renderSection = (item: NavItem) => {
    if (item.ownerOnly && !isOwner) return null;
    const Icon = item.icon;
    const children = (item.children || []).filter((child) => childVisible(child, isOwner));
    return (
      <section key={item.url + item.title} className="pb-2">
        {item.section ? (
          <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-[#636363]">
            {item.section}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => go(item.url)}
          className="flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[16px] font-semibold text-[#101010] hover:bg-[#F5F5F5]"
        >
          <Icon className="h-5 w-5 shrink-0 text-[#008080]" />
          <span className="flex-1 truncate">{item.title}</span>
          {item.badge ? (
            <span className="rounded-full bg-[#FFF7E6] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#A15C07]">
              {item.badge}
            </span>
          ) : null}
        </button>
        {children.length > 0 ? <div className="ml-7 border-l border-[#E2E6EA] pl-1">{children.map(renderChild)}</div> : null}
      </section>
    );
  };

  return (
    <>
      {menuOpen ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-white md:hidden" role="dialog" aria-label="Menu">
          <div className="flex items-center justify-between border-b border-[#E2E6EA] px-4 pb-3 pt-[calc(var(--safe-top)+12px)]">
            {showHelpTopics ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowHelpTopics(false)}
                  className="flex h-11 w-11 items-center justify-center rounded-full text-[#18212B] hover:bg-slate-100"
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

          <nav className="flex-1 overflow-y-auto px-3 py-2 pb-[calc(16px+var(--safe-bottom))]">
            {showHelpTopics ? (
              <div className="space-y-1.5 pb-6">
                <p className="px-3 pb-2 pt-1 text-xs text-slate-500">
                  Select a topic to watch the step-by-step video guide.
                </p>
                {HELP_TOPICS.map((topic) => (
                  <button
                    key={topic.key}
                    type="button"
                    onClick={() => handleOpenHelpTopic(topic.key)}
                    className="flex w-full items-center justify-between rounded-xl border border-slate-100 p-3 text-left hover:bg-slate-50"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-sm font-medium text-[#18212B]">{topic.title}</p>
                      <p className="truncate text-xs text-slate-500">{topic.desc}</p>
                    </div>
                    <PlayCircle className="h-5 w-5 shrink-0 text-[#008080]" />
                  </button>
                ))}
                <div className="pt-3">
                  <a
                    href="https://help.pgease.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-teal-50 p-3 text-xs font-semibold text-[#008080] hover:bg-teal-100"
                  >
                    Visit help.pgease.com for full documentation
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-2 rounded-2xl border border-[#E2E6EA] bg-[#F6F7F8] p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#636363]">Active PG</p>
                  <p className="mt-1 truncate text-[15px] font-semibold text-[#101010]">
                    {selectedPg?.name || "My PG"}
                  </p>
                  {list.length > 1 ? (
                    <div className="mt-2 space-y-1">
                      {list.map((pg) => (
                        <button
                          key={pg.id}
                          type="button"
                          onClick={() => setSelectedPgId(pg.id)}
                          className={cn(
                            "flex min-h-11 w-full items-center gap-2 rounded-xl px-2 text-left text-[14px]",
                            pg.id === selectedPgId ? "bg-white font-semibold text-[#008080]" : "text-[#101010]",
                          )}
                        >
                          <Building2 className="h-4 w-4 shrink-0" />
                          <span className="truncate">{pg.name}</span>
                          {pg.id === selectedPgId ? <Check className="ml-auto h-4 w-4 shrink-0" /> : null}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                {NAV_ITEMS.map(renderSection)}

                <section className="pb-2">
                  <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-[#636363]">
                    More
                  </p>
                  {[
                    { title: "Inventory", url: "/settings/inventory" },
                    { title: "Notifications", url: "/notifications" },
                    { title: "Contact Support", url: "/support" },
                  ].map((link) => (
                    <button
                      key={link.url}
                      type="button"
                      onClick={() => go(link.url)}
                      className="flex min-h-11 w-full items-center rounded-xl px-3 py-2.5 text-left text-[16px] text-[#101010] hover:bg-[#F5F5F5]"
                    >
                      {link.title}
                    </button>
                  ))}
                </section>

                <button
                  type="button"
                  onClick={() => setShowHelpTopics(true)}
                  className="flex min-h-11 w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-[16px] text-[#101010] hover:bg-[#F5F5F5]"
                >
                  <span className="flex items-center gap-2.5">
                    <HelpCircle className="h-4 w-4 text-[#008080]" />
                    <span>Help & Video Tutorials</span>
                  </span>
                  <span className="text-xs font-semibold text-[#008080]">Videos ›</span>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-1 flex min-h-11 w-full items-center gap-2 rounded-xl px-3 py-3 text-left text-[16px] text-[#B42318] hover:bg-[#FEF1F0]"
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
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E2E6EA] bg-white md:hidden"
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
                  "flex h-14 min-h-[44px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
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
              "flex h-14 min-h-[44px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
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
