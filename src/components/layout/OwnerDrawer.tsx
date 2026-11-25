import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  X,
  Building2,
  ChevronRight,
  ChevronDown,
  LayoutDashboard,
  BarChart3,
  DoorOpen,
  Sparkles,
  ShieldAlert,
  Image,
  Users,
  UserPlus,
  UserMinus,
  FileCheck2,
  IndianRupee,
  Receipt,
  Landmark,
  CreditCard,
  Wrench,
  UserCog,
  UtensilsCrossed,
  Bell,
  FileSpreadsheet,
  PieChart,
  TrendingUp,
  FileText,
  User,
  Settings,
  HelpCircle,
  MessageCircle,
  Info,
  LogOut,
  ShieldCheck,
  Crown,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { authStorage, performLogout } from "@/api/http";
import { useEntitlements } from "@/hooks/useEntitlements";
import { cn } from "@/lib/utils";

interface OwnerDrawerProps {
  open: boolean;
  onClose: () => void;
  onOpenSwitcher: () => void;
}

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const SECTIONS: NavSection[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
      { label: "Subscription Plans", to: "/plans", icon: Crown },
      { label: "Analytics", to: "/reports", icon: BarChart3 },
    ],
  },
  {
    title: "Property",
    items: [
      { label: "Rooms & Beds", to: "/my-pgs/structure", icon: DoorOpen },
      { label: "Amenities", to: "/my-pgs/amenities", icon: Sparkles },
      { label: "Rules & Restrictions", to: "/my-pgs/restrictions", icon: ShieldAlert },
      { label: "Photos & Listing", to: "/public-listing", icon: Image },
    ],
  },
  {
    title: "Tenants",
    items: [
      { label: "Tenant List", to: "/tenants", icon: Users },
      { label: "Check-ins / Add", to: "/tenants/add", icon: UserPlus },
      { label: "Move-outs & Notice", to: "/tenants/notice", icon: UserMinus },
      { label: "KYC Verification", to: "/tenants/kyc", icon: FileCheck2 },
    ],
  },
  {
    title: "Rent & Payments",
    items: [
      { label: "Dues & Collections", to: "/rent-payments", icon: IndianRupee },
      { label: "Offline Collection", to: "/rent-payments", icon: Receipt },
      { label: "Bank Accounts", to: "/my-pgs/bank-account", icon: Landmark },
      { label: "Payment Gateway", to: "/settings/payment-kyc", icon: CreditCard },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Complaints", to: "/complaints", icon: Wrench },
      { label: "Staff & Roles", to: "/team", icon: UserCog },
      { label: "Food Menu", to: "/food", icon: UtensilsCrossed },
      { label: "Notices & Broadcasts", to: "/my-pgs/notices", icon: Bell },
    ],
  },
  {
    title: "Reports",
    items: [
      { label: "Monthly Overview", to: "/reports", icon: FileSpreadsheet },
      { label: "Occupancy Report", to: "/reports", icon: PieChart },
      { label: "Revenue Analytics", to: "/reports", icon: TrendingUp },
      { label: "Financial Statement", to: "/reports", icon: FileText },
    ],
  },
  {
    title: "Settings",
    items: [
      { label: "Subscription & Billing", to: "/plans", icon: Sparkles },
      { label: "Profile", to: "/settings", icon: User },
      { label: "Notifications", to: "/notifications", icon: Bell },
      { label: "App Info", to: "/settings", icon: Info },
    ],
  },
  {
    title: "Help & Support",
    items: [
      { label: "Contact Support", to: "/support", icon: HelpCircle },
      { label: "Support WhatsApp", to: "/support", icon: MessageCircle },
      { label: "FAQs & Guides", to: "/support", icon: FileText },
    ],
  },
];

export const OwnerDrawer: React.FC<OwnerDrawerProps> = ({ open, onClose, onOpenSwitcher }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { properties, selectedPgId } = useApp();
  const isOwner = authStorage.isOwner();
  const entitlements = useEntitlements();
  const list = Array.isArray(properties) ? properties : [];
  const selectedPg = list.find((p) => p.id === selectedPgId);

  const owner = authStorage.getPropertyOwner();
  const ownerName = owner?.name && !owner.name.startsWith("user_") ? owner.name : "PG Owner";
  const ownerPhone = String((owner as any)?.phone || (owner as any)?.mobileContactNumber || "");
  const initials = (ownerName || "O").trim().slice(0, 2).toUpperCase();

  // Collapsible sections state - default all open
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    Overview: true,
    Property: true,
    Tenants: true,
    "Rent & Payments": true,
    Operations: true,
    Reports: true,
    Settings: true,
    "Help & Support": true,
  });

  const toggleSection = (title: string) => {
    setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const handleNavigate = (to: string) => {
    onClose();
    navigate(to);
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      onClose();
      performLogout();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay scrim */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-in drawer container: max 80% width or 340px */}
      <aside
        role="dialog"
        aria-label="Navigation Menu"
        className="relative z-50 flex h-full w-[82%] max-w-[340px] flex-col bg-white shadow-2xl transition-transform animate-in slide-in-from-left duration-250"
      >
        {/* Profile Header */}
        <div
          className="bg-gradient-to-br from-[#006666] to-[#004D4D] p-4 text-white"
          style={{ paddingTop: "calc(var(--safe-top) + 16px)" }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20 text-white font-bold text-base border-2 border-white/30 shadow-inner">
                {initials}
              </div>
              <div className="min-w-0">
                <h3 className="text-[15px] font-bold text-white truncate leading-tight">
                  {ownerName}
                </h3>
                {ownerPhone ? (
                  <p className="text-xs text-teal-100/90 truncate mt-0.5">{ownerPhone}</p>
                ) : null}
                <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-300">
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                  <span>Verified Owner</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Active PG Switcher Row (O1 / O2) */}
          <div className="mt-3.5 rounded-xl bg-white/10 p-2.5 backdrop-blur-xs border border-white/15">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20 text-white">
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">
                    {selectedPg?.name ?? "Select Property"}
                  </p>
                  <p className="text-[10.5px] text-teal-100/80 truncate">
                    {selectedPg?.address || "Address not set"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSwitcher();
                }}
                className="shrink-0 rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-[#008080] hover:bg-teal-50 shadow-xs transition-colors"
              >
                Switch
              </button>
            </div>
          </div>

          {/* Subscription & Plan Status Card */}
          {isOwner && (
            <div
              onClick={() => handleNavigate("/plans")}
              className="mt-2.5 rounded-xl bg-gradient-to-r from-teal-900/80 to-emerald-950/70 p-2.5 backdrop-blur-xs border border-white/20 hover:border-white/40 transition-all cursor-pointer shadow-sm group"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20 text-white">
                    <Crown className="h-4 w-4 text-amber-300" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12px] font-bold text-white truncate">
                        {entitlements.isExpired
                          ? "Subscription Expired"
                          : entitlements.isTrial
                          ? `Pro Trial (${entitlements.daysRemaining}d left)`
                          : entitlements.isPro
                          ? "PG Ease Pro Active"
                          : entitlements.isLite
                          ? "Lite Plan Active"
                          : "Subscription Plan"}
                      </span>
                    </div>
                    <p className="text-[10.5px] text-teal-100/80 truncate">
                      {entitlements.isExpired
                        ? "Tap to renew subscription"
                        : entitlements.isPro
                        ? "Manage beds & billing"
                        : "Tap to view & upgrade plans"}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 rounded-lg bg-white/20 group-hover:bg-white text-white group-hover:text-[#008080] px-2.5 py-1 text-[11px] font-bold transition-all shadow-xs flex items-center gap-0.5">
                  <span>{entitlements.isExpired ? "Renew" : "Plans"}</span>
                  <ChevronRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Grouped Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {SECTIONS.map((section) => {
            const isOpen = openSections[section.title] ?? true;
            return (
              <div key={section.title} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleSection(section.title)}
                  className="flex w-full items-center justify-between px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <span>{section.title}</span>
                  {isOpen ? (
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                  )}
                </button>

                {isOpen && (
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.to;
                      return (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => handleNavigate(item.to)}
                          className={cn(
                            "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[13.5px] font-medium transition-colors",
                            isActive
                              ? "bg-[#E6F3F3] text-[#008080] font-semibold"
                              : "text-slate-700 hover:bg-slate-100/80 hover:text-slate-900"
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon
                              className={cn("h-4 w-4", isActive ? "text-[#008080]" : "text-slate-500")}
                            />
                            <span>{item.label}</span>
                          </div>
                          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Drawer Footer: Logout */}
        <div
          className="border-t border-slate-100 p-3 bg-slate-50/50"
          style={{ paddingBottom: "calc(var(--safe-bottom) + 12px)" }}
        >
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100/80 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout from Account</span>
          </button>
        </div>
      </aside>
    </div>
  );
};
