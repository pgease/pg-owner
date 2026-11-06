import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Building2,
  IndianRupee,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  X,
  Wrench,
  Lock,
  UserCog,
  Sparkles,
  Check,
  Plus,
  MessageSquare,
  Crown,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import pgeaseBrandLogoWhite from "@/assets/pgease-full-brand-logo-white.png";
import pgeaseIconColor from "@/assets/pgease-icon-color.png";
import pgeaseIconWhite from "@/assets/pgease-icon-white.png";
import { authStorage } from "@/api/http";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { usePermissions } from "@/context/PermissionContext";
import { useApp } from "@/context/AppContext";
import { useSubscriptionAccess } from "@/hooks/useSubscriptionAccess";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TrialExpiredGateModal } from "@/components/common/TrialExpiredGateModal";

interface NavChild {
  title: string;
  url: string;
  badge?: string;
  permissionKey?: string;
  featureKey?: string;
  ownerOnly?: boolean;
  isExternal?: boolean;
}

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
  section?: string;
  badge?: string;
  children?: NavChild[];
  permissionKey?: string;
  featureKey?: string;
  ownerOnly?: boolean;
}

/**
 * Navigation mirrors the routes in App.tsx. Labels use plain PG-owner language.
 * Clean, operational structure with rich #008080 (Teal) SaaS theme.
 */
const NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    section: "Overview",
    permissionKey: "dashboard_access",
  },
  {
    title: "Property",
    url: "/my-pgs",
    icon: Building2,
    section: "Management",
    permissionKey: "room_view",
    children: [
      { title: "PG Details", url: "/my-pgs", permissionKey: "room_view" },
      { title: "Rooms & Beds", url: "/my-pgs/structure", permissionKey: "room_view" },
      { title: "Facilities", url: "/my-pgs/amenities", permissionKey: "room_view" },
      { title: "Restrictions", url: "/my-pgs/restrictions", permissionKey: "room_view" },
      { title: "WiFi", url: "/my-pgs/wifi", permissionKey: "room_view", featureKey: "wifi_management", badge: "Beta" },
      { title: "Notice Board", url: "/my-pgs/notices", permissionKey: "room_view" },
      { title: "Bank Account", url: "/my-pgs/bank", ownerOnly: true },
      { title: "Public Listing", url: "/post-pg", permissionKey: "room_view", badge: "Live" },
    ],
  },
  {
    title: "Tenants",
    url: "/tenants",
    icon: Users,
    permissionKey: "tenant_view",
    children: [
      { title: "All Tenants", url: "/tenants", permissionKey: "tenant_view" },
      { title: "Leads & Visits", url: "/leads", permissionKey: "tenant_view", featureKey: "lead_crm", badge: "Beta" },
      { title: "KYC & Agreements", url: "/tenants/kyc", permissionKey: "kyc_view", featureKey: "aadhaar_kyc" },
      { title: "Notice Period", url: "/tenants/notice-period", permissionKey: "tenant_view" },
    ],
  },
  {
    title: "Rent & Payments",
    url: "/rent-payments",
    icon: IndianRupee,
    section: "Finance & Ops",
    permissionKey: "account_view_dues",
    children: [
      { title: "Rent Collection", url: "/rent-payments", permissionKey: "account_view_dues" },
      { title: "Payment History", url: "/rent-payments/history", permissionKey: "account_view_dues" },
      { title: "Dues & Pending", url: "/rent-payments/dues", permissionKey: "account_view_dues" },
      { title: "Expenses", url: "/expenses", permissionKey: "expense_view", featureKey: "expense_tracking" },
    ],
  },
  {
    title: "Operations",
    url: "/complaints",
    icon: Wrench,
    permissionKey: "complaint_view_all",
    children: [
      { title: "Complaints", url: "/complaints", permissionKey: "complaint_view_all" },
      { title: "Food & Meals", url: "/food", permissionKey: "food_view_edit" },
      { title: "Night Out Logs", url: "/nightout", permissionKey: "nightout_view" },
      { title: "Guest Requests", url: "/tenants/guests", permissionKey: "guest_log" },
    ],
  },
  {
    title: "Group Chat",
    url: "/group-chat",
    icon: MessageSquare,
    badge: "Soon",
  },
  {
    title: "Staff",
    url: "/team",
    icon: UserCog,
    ownerOnly: true,
    permissionKey: "team_view_members",
    featureKey: "staff_roles_permissions",
    children: [
      { title: "Team Members", url: "/team", ownerOnly: true, permissionKey: "team_view_members", featureKey: "staff_roles_permissions" },
      { title: "Permissions", url: "/team/permissions-matrix", ownerOnly: true, permissionKey: "team_view_members", featureKey: "staff_roles_permissions" },
    ],
  },
  {
    title: "Reports",
    url: "/reports",
    icon: BarChart3,
    section: "System",
    badge: "Pro",
    permissionKey: "account_view_dues",
    featureKey: "advanced_reports",
  },
  {
    title: "Account",
    url: "/settings",
    icon: Settings,
    children: [
      { title: "Settings", url: "/settings" },
      { title: "Plans & Billing", url: "/plans", ownerOnly: true },
      { title: "Refer & Earn", url: "/referrals", ownerOnly: true },
      { title: "Help & Documentation", url: "https://help.pgease.com", isExternal: true },
      { title: "Activity Logs", url: "/activity-logs", featureKey: "audit_logs" },
    ],
  },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

interface SidebarContentProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const PRO_FEATURE_DESCRIPTIONS: Record<string, { title: string; desc: string; highlights: string[] }> = {
  wifi_management: {
    title: "WiFi & Network Management",
    desc: "Automate WiFi password distribution to active tenants and rotate network credentials securely.",
    highlights: ["Automatic credentials sharing on check-in", "Bandwidth and router allocation", "Revoke credentials upon move-out"],
  },
  digital_notice_board: {
    title: "Digital Notice Board & Broadcasts",
    desc: "Post digital announcements and broadcast notices directly to tenant mobile apps and WhatsApp.",
    highlights: ["Push notifications to all or specific rooms", "Read receipts and tenant acknowledgments", "Emergency maintenance alerts"],
  },
  lead_crm: {
    title: "Leads & Inquiry Management",
    desc: "Track prospective tenant inquiries, scheduled room visits, and follow-ups in a centralized CRM.",
    highlights: ["Public inquiry lead capture", "Scheduled visits reminder", "1-click convert inquiry to tenant"],
  },
  aadhaar_kyc: {
    title: "Instant Digital KYC & Rental Agreements",
    desc: "Verify resident identity seamlessly with DigiLocker Aadhaar e-KYC and execute digital rent agreements.",
    highlights: ["Instant Government-verified Aadhaar verification", "Digital signature rental agreements", "Secure paperless record storage"],
  },
  notice_period_tracker: {
    title: "Notice Period & Vacancy Pipeline",
    desc: "Track move-out notices, auto-calculate notice periods, and mark upcoming vacant beds for early booking.",
    highlights: ["Automated 30-day notice countdown", "Upcoming bed vacancy calendar", "Deposit refund checklist integration"],
  },
  expense_tracking: {
    title: "Comprehensive Expense & Bill Tracking",
    desc: "Log daily operational costs, utility bills, caretaker salaries, and generate real-time monthly profit reports.",
    highlights: ["Category-wise expense breakdown (Electricity, Mess, WiFi)", "Vendor invoice attachment", "Automated Net Profit/Loss calculations"],
  },
  food_menu_planner: {
    title: "Food Menu & Mess Timings",
    desc: "Publish daily breakfast, lunch, and dinner menus to tenants with meal feedback and holiday skip alerts.",
    highlights: ["Weekly dynamic meal planner", "Tenant meal preferences and skip counts", "Kitchen mess headcount forecasting"],
  },
  nightout_guest_requests: {
    title: "Night Out Logs & Guest Check-in Approval",
    desc: "Automate tenant night-out permissions and visitor check-ins with security approval workflows.",
    highlights: ["Digital gate register and visitor verification", "Night-out curfew approvals with parent SMS alerts", "Searchable historical security log"],
  },
  staff_roles_permissions: {
    title: "Staff Members & Granular Access Control",
    desc: "Empower managers, wardens, cooks, and security guards with custom roles without sharing owner credentials.",
    highlights: ["Granular role presets (Manager, Warden, Accountant, Caretaker)", "Hide financial dues and revenue from operational staff", "Staff action audit tracking"],
  },
  advanced_reports: {
    title: "Advanced Financial Reports & Analytics",
    desc: "Export detailed Excel and PDF ledgers, revenue ageing buckets, and annual tax summaries.",
    highlights: ["12-month revenue trend analysis", "Overdue ageing buckets (0-30, 30-60, 60+ days)", "One-click CA/Auditor Excel export"],
  },
  audit_logs: {
    title: "Security Audit & Activity Logs",
    desc: "Track every staff and owner action, payment modification, tenant allocation, and room update with timestamps.",
    highlights: ["Immutable audit trail with user identity and timestamp", "Track payment edits and receipt deletions", "Security peace of mind"],
  },
};

const SidebarContent = ({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarContentProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isOwner, can } = usePermissions();
  const featureAccess = useFeatureAccess();
  const { properties, selectedPgId, setSelectedPgId } = useApp();
  const subAccess = useSubscriptionAccess();
  const [trialExpiredOpen, setTrialExpiredOpen] = useState(false);
  const [proModalFeature, setProModalFeature] = useState<{
    open: boolean;
    title: string;
    description: string;
    highlights?: string[];
  }>({
    open: false,
    title: "",
    description: "",
  });

  const handleLockedFeatureClick = (title: string, featureKey?: string) => {
    const info = featureKey && PRO_FEATURE_DESCRIPTIONS[featureKey]
      ? PRO_FEATURE_DESCRIPTIONS[featureKey]
      : {
          title,
          desc: `${title} is an automated feature included with PG Ease Pro. Upgrade to unlock full access for your PG.`,
          highlights: ["Automated operations workflows", "Priority support manager", "Multi-platform access"],
        };
    setProModalFeature({
      open: true,
      title: info.title,
      description: info.desc,
      highlights: info.highlights,
    });
  };

  const selectedPg = useMemo(
    () => (Array.isArray(properties) ? properties.find((p) => p.id === selectedPgId) : null),
    [properties, selectedPgId],
  );

  const handleAddProperty = () => {
    if (subAccess.isExpired) {
      setTrialExpiredOpen(true);
    } else {
      navigate("/my-pgs/structure");
      if (mobileOpen) onMobileClose();
    }
  };

  const owner = authStorage.getPropertyOwner();
  const ownerName = owner?.name && !owner.name.startsWith("user_") ? owner.name : "";
  const ownerPhone = owner?.mobileContactNumber || (owner as any)?.phone || "";

  const isFeatureNavLocked = (featureKey?: string) => {
    if (!featureKey) return false;
    if (typeof featureAccess?.isFeatureNavLocked === "function") {
      return featureAccess.isFeatureNavLocked(featureKey);
    }
    if (typeof featureAccess?.isNavChildLocked === "function") {
      return featureAccess.isNavChildLocked(featureKey);
    }
    return false;
  };

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    NAV_ITEMS.forEach((item) => {
      if (item.children) {
        const matches = item.children.some(
          (c) => location.pathname === c.url || (c.url !== "/" && location.pathname.startsWith(c.url)),
        );
        if (matches) initial[item.title] = true;
      }
    });
    return initial;
  });

  const toggleGroup = (item: NavItem) => {
    const current = isGroupOpen(item);
    setOpenGroups((prev) => ({ ...prev, [item.title]: !current }));
  };

  const isGroupActive = (item: NavItem): boolean => {
    if (location.pathname === item.url) return true;
    if (item.children) {
      return item.children.some(
        (c) => location.pathname === c.url || (c.url !== "/" && location.pathname.startsWith(c.url)),
      );
    }
    return item.url !== "/" && location.pathname.startsWith(item.url);
  };

  const isGroupOpen = (item: NavItem): boolean => {
    if (openGroups[item.title] !== undefined) return openGroups[item.title];
    return isGroupActive(item);
  };

  const handleLogout = () => {
    authStorage.clear();
    navigate("/login");
  };

  const isLockedByPermission = (permissionKey?: string) => {
    if (!permissionKey || isOwner) return false;
    return !can(permissionKey);
  };

  const isLockedByFeature = (featureKey?: string) => {
    if (!featureKey) return false;
    return isFeatureNavLocked(featureKey);
  };

  const goToPlans = () => {
    navigate("/plans");
    onMobileClose?.();
  };

  const renderChild = (child: NavChild) => {
    if (child.ownerOnly && !isOwner) {
      return null;
    }

    if (child.isExternal) {
      return (
        <a
          href={child.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-[36px] items-center justify-between gap-2 rounded-lg px-2.5 text-[14px] font-medium text-teal-100/80 transition-all duration-150 hover:bg-white/10 hover:text-white"
          onClick={onMobileClose}
        >
          <span className="truncate">{child.title}</span>
          <span className="rounded-full bg-teal-400/20 border border-teal-300/30 px-1.5 py-0.5 text-[10px] font-bold text-teal-100">
            ↗
          </span>
        </a>
      );
    }

    const permLocked = isLockedByPermission(child.permissionKey);
    const featLocked = isLockedByFeature(child.featureKey);

    if (featLocked) {
      return (
        <button
          type="button"
          onClick={() => handleLockedFeatureClick(child.title, child.featureKey)}
          className="flex h-[36px] w-full items-center justify-between gap-2 rounded-lg px-2.5 text-left text-[14.5px] text-teal-100/75 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
          title="Available on the Pro plan. Click to view details."
        >
          <span className="truncate">{child.title}</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 border border-amber-300/30 px-1.5 py-0.5 text-[10.5px] font-black text-amber-200">
            <Lock className="h-2.5 w-2.5" aria-hidden /> Pro
          </span>
        </button>
      );
    }

    if (permLocked) {
      return (
        <div
          className="flex h-[36px] w-full cursor-not-allowed items-center justify-between gap-2 rounded-lg px-2.5 text-[14px] text-teal-200/40"
          title="You don't have access to this section. Ask the PG owner."
          aria-disabled
        >
          <span className="truncate">{child.title}</span>
          <Lock className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
        </div>
      );
    }

    return (
      <NavLink
        to={child.url}
        end
        className="flex h-[36px] items-center justify-between gap-2 rounded-lg px-2.5 text-[14px] font-medium text-teal-100/80 transition-all duration-150 hover:bg-white/10 hover:text-white"
        activeClassName="bg-white/20 font-bold text-white shadow-xs border-l-2 border-white pl-2 hover:bg-white/25 hover:text-white"
        onClick={onMobileClose}
      >
        <span className="truncate">{child.title}</span>
        {child.badge ? (
          <span className="rounded-full bg-teal-400/20 border border-teal-300/30 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-teal-100">
            {child.badge}
          </span>
        ) : null}
      </NavLink>
    );
  };

  const renderTopLevel = (item: NavItem) => {
    if (item.ownerOnly && !isOwner) {
      return null;
    }

    const visibleChildren = item.children?.filter((c) => !(c.ownerOnly && !isOwner));
    const hasChildren = Boolean(visibleChildren?.length);
    const active = isGroupActive(item);
    const topLocked = isLockedByPermission(item.permissionKey) || isLockedByFeature(item.featureKey);
    const featLocked = isLockedByFeature(item.featureKey);
    const Icon = item.icon;

    // Collapsed rail: icon only, rich tooltip with label, expands on click
    if (collapsed) {
      const target = featLocked ? (isOwner ? "/plans" : item.url) : item.url;
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={item.title}
              onClick={(e) => {
                e.stopPropagation();
                if (hasChildren) {
                  setOpenGroups((prev) => ({ ...prev, [item.title]: true }));
                }
                onToggle();
                if (!hasChildren) {
                  navigate(target);
                }
              }}
              className={cn(
                "mx-auto flex h-[40px] w-[40px] items-center justify-center rounded-xl text-teal-100/75 transition-all duration-150 hover:bg-white/15 hover:text-white cursor-pointer",
                active && "bg-white text-[#006666] font-bold shadow-md shadow-teal-950/20 hover:bg-white hover:text-[#006666]",
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs bg-slate-900 text-white border-slate-700 shadow-xl">
            {item.title}
            {featLocked && isOwner ? " · Pro" : ""}
          </TooltipContent>
        </Tooltip>
      );
    }

    if (hasChildren) {
      const open = isGroupOpen(item);
      return (
        <div className="space-y-0.5">
          <button
            type="button"
            onClick={() => toggleGroup(item)}
            aria-expanded={open}
            className={cn(
              "group flex h-[44px] w-full items-center gap-2.5 rounded-xl px-3 text-[16px] font-semibold transition-all duration-150",
              active
                ? "bg-white/15 text-white shadow-xs ring-1 ring-white/20"
                : "text-teal-100/85 hover:bg-white/10 hover:text-white",
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5 shrink-0 transition-colors",
                active ? "text-white" : "text-teal-200/85 group-hover:text-white",
              )}
              aria-hidden
            />
            <span className="flex-1 text-left truncate">{item.title}</span>
            {item.badge ? (
              <span className="mr-1 rounded-full bg-teal-400/20 border border-teal-300/30 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-teal-100">
                {item.badge}
              </span>
            ) : null}
            <ChevronDown
              className={cn(
                "h-4 w-4 text-teal-200/70 transition-transform duration-200",
                open && "rotate-180 text-white",
              )}
              aria-hidden
            />
          </button>
          {open ? (
            <ul className="ml-4 mt-1 space-y-0.5 border-l-2 border-white/20 pl-2">
              {visibleChildren!.map((child) => (
                <li key={child.url}>{renderChild(child)}</li>
              ))}
            </ul>
          ) : null}
        </div>
      );
    }

    if (featLocked) {
      return (
        <button
          type="button"
          onClick={() => handleLockedFeatureClick(item.title, item.featureKey)}
          className="flex h-[44px] w-full items-center gap-2.5 rounded-xl px-3 text-[16px] font-medium text-teal-100/75 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
          title="Available on the Pro plan. Click to view details."
        >
          <Icon className="h-5 w-5 shrink-0 text-teal-200/75" aria-hidden />
          <span className="flex-1 text-left truncate">{item.title}</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 border border-amber-300/30 px-1.5 py-0.5 text-[10.5px] font-black text-amber-200">
            <Lock className="h-2.5 w-2.5" aria-hidden /> Pro
          </span>
        </button>
      );
    }

    if (topLocked) {
      return (
        <div
          className="flex h-[44px] w-full cursor-not-allowed items-center gap-2.5 rounded-xl px-3 text-[16px] font-medium text-teal-200/40"
          title="You don't have access to this section. Ask the PG owner."
          aria-disabled
        >
          <Icon className="h-5 w-5 shrink-0 opacity-60" aria-hidden />
          <span className="flex-1 text-left truncate">{item.title}</span>
          <Lock className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
        </div>
      );
    }

    return (
      <NavLink
        to={item.url}
        end={item.url === "/"}
        className="group flex h-[44px] items-center gap-2.5 rounded-xl px-3 text-[16px] font-semibold text-teal-100/85 transition-all duration-150 hover:bg-white/10 hover:text-white"
        activeClassName="bg-white text-[#006666] font-bold shadow-md shadow-teal-950/20 hover:bg-white hover:text-[#006666]"
        onClick={onMobileClose}
      >
        <Icon
          className={cn(
            "h-5 w-5 shrink-0 transition-colors",
            active ? "text-[#008080]" : "text-teal-200/85 group-hover:text-white",
          )}
          aria-hidden
        />
        <span className="truncate">{item.title}</span>
        {item.badge ? (
          <span className="ml-auto rounded-full bg-teal-400/20 border border-teal-300/30 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-teal-100">
            {item.badge}
          </span>
        ) : null}
      </NavLink>
    );
  };

  return (
    <>
      {/* Brand & Property Switcher Header (Rentok Style) */}
      <div
        className={cn(
          "flex h-[64px] items-center select-none",
          collapsed ? "justify-center px-2" : "justify-between px-3",
        )}
      >
        {!collapsed ? (
          <div className="flex-1 min-w-0 flex items-center justify-between">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="group flex flex-1 min-w-0 items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-white/10 text-white transition-all cursor-pointer text-left focus:outline-hidden"
                  aria-label="Switch property"
                >
                  <div className="h-9 w-9 rounded-full bg-white flex items-center justify-center p-1 shadow-sm ring-2 ring-white/30 shrink-0 group-hover:scale-105 group-hover:ring-white/60 transition-all">
                    <img
                      src={pgeaseIconColor}
                      alt="PG Ease"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[16.5px] font-extrabold text-white tracking-tight truncate leading-tight">
                        {selectedPg ? selectedPg.name : properties.length ? "Select a PG" : "My PG"}
                      </span>
                      <div className="h-5 w-5 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-teal-200 group-hover:text-white group-hover:bg-white/20 transition-all">
                        <ChevronDown className="h-3.5 w-3.5" />
                      </div>
                    </div>
                    <p className="text-[12px] text-teal-200/80 truncate font-medium leading-tight mt-0.5">
                      {selectedPg?.address || "PG Ease Portal"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                sideOffset={8}
                className="w-72 rounded-2xl p-2 shadow-2xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 z-50"
              >
                <div className="px-2.5 py-1.5">
                  <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Switch Active PG
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Select a property to view rooms, dues, tenants & meals.
                  </p>
                </div>
                <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 my-1" />
                <div className="max-h-[260px] overflow-y-auto space-y-1 scrollbar-thin">
                  {properties.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-400">
                      No properties added yet
                    </div>
                  ) : (
                    properties.map((pg) => {
                      const isSelected = selectedPgId === pg.id;
                      return (
                        <DropdownMenuItem
                          key={pg.id}
                          onClick={() => {
                            setSelectedPgId(pg.id);
                            if (mobileOpen) onMobileClose();
                          }}
                          className={cn(
                            "flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold cursor-pointer transition-all",
                            isSelected
                              ? "bg-teal-50 dark:bg-teal-950/40 text-[#008080] dark:text-teal-300 font-bold"
                              : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800",
                          )}
                        >
                          <div
                            className={cn(
                              "h-7 w-7 rounded-lg flex items-center justify-center shrink-0",
                              isSelected
                                ? "bg-[#008080] text-white shadow-xs"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-500",
                            )}
                          >
                            <Building2 className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="truncate leading-tight font-bold">{pg.name}</p>
                            <p className="text-[10px] text-slate-400 truncate leading-tight mt-0.5">
                              {pg.address || "Configured property"}
                            </p>
                          </div>
                          {isSelected ? (
                            <Check className="h-4 w-4 text-[#008080] shrink-0 font-bold" />
                          ) : null}
                        </DropdownMenuItem>
                      );
                    })
                  )}
                </div>
                <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 my-1" />
                <DropdownMenuItem
                  onClick={handleAddProperty}
                  className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-bold text-[#008080] hover:bg-teal-50 dark:hover:bg-teal-950/40 cursor-pointer transition-colors"
                >
                  <div className="h-6 w-6 rounded-md bg-[#008080]/15 text-[#008080] flex items-center justify-center shrink-0">
                    <Plus className="h-3.5 w-3.5" />
                  </div>
                  <span>Add New Property</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {mobileOpen ? (
              <button
                type="button"
                onClick={onMobileClose}
                className="rounded-lg p-1.5 text-teal-200 hover:bg-white/10 hover:text-white md:hidden transition-colors ml-1 shrink-0"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            ) : null}
          </div>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="h-10 w-10 rounded-full bg-white flex items-center justify-center p-1 shadow-sm ring-2 ring-white/30 hover:scale-105 hover:ring-white/60 transition-all cursor-pointer focus:outline-hidden"
                title={selectedPg?.name || "Switch PG"}
              >
                <img
                  src={pgeaseIconColor}
                  alt="PG Ease"
                  className="h-full w-full object-contain"
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="right"
              align="start"
              sideOffset={12}
              className="w-72 rounded-2xl p-2 shadow-2xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 z-50"
            >
              <div className="px-2.5 py-1.5">
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Switch Active PG
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Select a property to view rooms, dues, tenants & meals.
                </p>
              </div>
              <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 my-1" />
              <div className="max-h-[260px] overflow-y-auto space-y-1 scrollbar-thin">
                {properties.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-400">
                    No properties added yet
                  </div>
                ) : (
                  properties.map((pg) => {
                    const isSelected = selectedPgId === pg.id;
                    return (
                      <DropdownMenuItem
                        key={pg.id}
                        onClick={() => {
                          setSelectedPgId(pg.id);
                          if (mobileOpen) onMobileClose();
                        }}
                        className={cn(
                          "flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold cursor-pointer transition-all",
                          isSelected
                            ? "bg-teal-50 dark:bg-teal-950/40 text-[#008080] dark:text-teal-300 font-bold"
                            : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800",
                        )}
                      >
                        <div
                          className={cn(
                            "h-7 w-7 rounded-lg flex items-center justify-center shrink-0",
                            isSelected
                              ? "bg-[#008080] text-white shadow-xs"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-500",
                          )}
                        >
                          <Building2 className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate leading-tight font-bold">{pg.name}</p>
                          <p className="text-[10px] text-slate-400 truncate leading-tight mt-0.5">
                            {pg.address || "Configured property"}
                          </p>
                        </div>
                        {isSelected ? (
                          <Check className="h-4 w-4 text-[#008080] shrink-0 font-bold" />
                        ) : null}
                      </DropdownMenuItem>
                    );
                  })
                )}
              </div>
              <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 my-1" />
              <DropdownMenuItem
                onClick={handleAddProperty}
                className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-bold text-[#008080] hover:bg-teal-50 dark:hover:bg-teal-950/40 cursor-pointer transition-colors"
              >
                <div className="h-6 w-6 rounded-md bg-[#008080]/15 text-[#008080] flex items-center justify-center shrink-0">
                  <Plus className="h-3.5 w-3.5" />
                </div>
                <span>Add New Property</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Primary Navigation */}
      <nav
        aria-label="Main"
        className="flex-1 overflow-y-auto overscroll-contain px-2 py-2.5 space-y-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-teal-800/40 hover:[&::-webkit-scrollbar-thumb]:bg-teal-700/60 [&::-webkit-scrollbar-thumb]:rounded-full"
      >
        {NAV_ITEMS.map((item, index) => {
          const showSection = !collapsed && item.section;
          return (
            <div key={item.title}>
              {showSection ? (
                <div
                  className={cn(
                    "px-3 pb-1.5 text-[11.5px] font-black uppercase tracking-wider text-teal-200/65 select-none",
                    index > 0 ? "pt-4" : "pt-2",
                  )}
                >
                  {item.section}
                </div>
              ) : null}
              {renderTopLevel(item)}
            </div>
          );
        })}
      </nav>

      {/* User / Owner Profile & Logout Bar */}
      <div className="border-t border-teal-700/40 bg-teal-900/30 p-2.5 space-y-1.5 backdrop-blur-xs">
        {!collapsed ? (
          <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-lg bg-teal-400/20 border border-teal-300/30 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
                {ownerName ? ownerName.charAt(0).toUpperCase() : "O"}
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-bold text-white truncate leading-tight">
                  {ownerName || "PG Owner"}
                </p>
                <p className="text-[12px] text-teal-200/80 truncate leading-tight mt-0.5">
                  {ownerPhone || (isOwner ? "Owner Admin" : "Staff Member")}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Log out"
              className="h-8 w-8 rounded-lg flex items-center justify-center text-teal-200 hover:text-rose-200 hover:bg-rose-500/25 transition-colors shrink-0"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleLogout}
                className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl text-teal-200 transition-colors hover:bg-rose-500/25 hover:text-rose-200"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs bg-slate-900 text-white border-slate-700 shadow-xl">
              Log out ({ownerName || "PG Owner"})
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Collapse Toggle (Desktop) */}
      <div className="hidden border-t border-teal-700/30 p-2 md:block bg-teal-950/20">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex h-8 w-full items-center justify-center gap-2 rounded-xl bg-white/5 hover:bg-white/15 text-teal-200/90 hover:text-white transition-all cursor-pointer border border-white/10"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" aria-hidden />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" aria-hidden />
              <span className="text-[12px] font-semibold">Collapse</span>
            </>
          )}
        </button>
      </div>

      <TrialExpiredGateModal open={trialExpiredOpen} onOpenChange={setTrialExpiredOpen} />

      <Dialog open={proModalFeature.open} onOpenChange={(open) => setProModalFeature((prev) => ({ ...prev, open }))}>
        <DialogContent className="max-w-md p-6 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl">
          <DialogHeader className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-xs font-black text-amber-700 dark:text-amber-300">
                <Crown className="h-3.5 w-3.5 text-amber-600" /> Pro Feature
              </span>
            </div>
            <DialogTitle className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {proModalFeature.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {proModalFeature.description}
            </DialogDescription>
          </DialogHeader>

          {proModalFeature.highlights && proModalFeature.highlights.length > 0 ? (
            <div className="mt-3 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/60 p-3.5 space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">Included in PG Ease Pro</p>
              <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                {proModalFeature.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-3 flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-slate-900 dark:text-white">PG Ease Pro</p>
              <p className="text-[11px] text-slate-500">₹49 / bed / month + 18% GST</p>
            </div>
            <span className="text-[10.5px] font-semibold text-teal-700 dark:text-teal-300 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
              Lite is ₹29/bed
            </span>
          </div>

          <div className="mt-5 flex items-center justify-end gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setProModalFeature((prev) => ({ ...prev, open: false }))}
              className="text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setProModalFeature((prev) => ({ ...prev, open: false }));
                navigate("/plans");
                if (mobileOpen) onMobileClose?.();
              }}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl px-4 gap-1.5 shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Upgrade to Pro (₹49/bed)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

const AppSidebar = ({ collapsed, onToggle, mobileOpen, onMobileClose }: AppSidebarProps) => {
  return (
    <>
      {mobileOpen ? (
        <div
          className="fixed inset-0 z-40 bg-[rgba(10,30,30,0.65)] backdrop-blur-xs md:hidden"
          onClick={onMobileClose}
          aria-hidden
        />
      ) : null}

      {/* Desktop Sidebar: 260px or 64px, seamless deep teal gradient */}
      <aside
        onClick={() => {
          if (collapsed) {
            onToggle();
          }
        }}
        title={collapsed ? "Click to expand sidebar" : undefined}
        className={cn(
          "hidden md:flex h-dvh shrink-0 flex-col bg-gradient-to-b from-[#005555] via-[#004b4b] to-[#003d3d] text-white transition-[width] duration-200 shadow-xl select-none z-30",
          collapsed ? "w-[64px] cursor-pointer hover:brightness-105" : "w-[260px]",
        )}
      >
        <SidebarContent collapsed={collapsed} onToggle={onToggle} mobileOpen={false} onMobileClose={onMobileClose} />
      </aside>

      {/* Mobile Drawer */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-dvh max-h-screen w-[280px] max-w-[85vw] flex-col border-r border-white/10 bg-gradient-to-b from-[#005555] via-[#004b4b] to-[#003d3d] text-white transition-[transform,visibility] duration-200 md:hidden shadow-2xl select-none",
          mobileOpen ? "translate-x-0 visible" : "-translate-x-full invisible",
        )}
        aria-hidden={!mobileOpen}
      >
        <SidebarContent collapsed={false} onToggle={onToggle} mobileOpen={mobileOpen} onMobileClose={onMobileClose} />
      </aside>
    </>
  );
};

export default AppSidebar;
