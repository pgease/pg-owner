import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  BookOpen,
  CreditCard,
  Crown,
  FileText,
  Gift,
  HelpCircle,
  History,
  Landmark,
  LogOut,
  Megaphone,
  MessageSquareWarning,
  Moon,
  Package,
  Phone,
  Receipt,
  Settings,
  Shield,
  Sun,
  Trash2,
  UserCog,
} from "lucide-react";
import { authStorage, performLogout } from "@/api/http";
import { useEntitlements } from "@/hooks/useEntitlements";
import { useNetworkStatus } from "@/mobile/hooks/useNetworkStatus";
import type { IconTone } from "@/mobile/tokens";
import { MobileAppHeader } from "@/mobile/components/ui/MobileHeaders";
import { PageScaffold } from "@/mobile/components/ui/PageScaffold";
import {
  Avatar,
  ConfirmDialog,
  DangerButton,
  ListRow,
  MobileCard,
  SectionHeader,
} from "@/mobile/components/ui/Primitives";
import pgeaseIconColor from "@/assets/pgease-icon-color.png";

export default function MobileMenuV2() {
  const navigate = useNavigate();
  const entitlements = useEntitlements();
  const { isOffline, lastUpdated } = useNetworkStatus();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [appVersion, setAppVersion] = useState("1.0.11");
  const [isDark, setIsDark] = useState(() =>
    typeof document !== "undefined" ? document.documentElement.classList.contains("dark") : false,
  );

  useEffect(() => {
    const capApp = (window as any).Capacitor?.Plugins?.App;
    if (capApp?.getInfo) {
      void capApp.getInfo().then((info: { version?: string }) => {
        if (info?.version) setAppVersion(info.version);
      }).catch(() => {});
    }
  }, []);

  const toggleDark = () => {
    const next = !isDark;
    setIsDark(next);
    const val = next ? "dark" : "light";
    document.documentElement.classList.toggle("dark", next);
    document.documentElement.setAttribute("data-theme", val);
    document.documentElement.style.colorScheme = val;
    try {
      localStorage.setItem("pgease_theme", val);
      localStorage.setItem("theme", val);
      const prefs = (window as any).Capacitor?.Plugins?.Preferences;
      if (prefs?.set) void prefs.set({ key: "pgease_theme", value: val });
    } catch {
      // ignore
    }
  };

  const owner = authStorage.getPropertyOwner();
  const ownerName = owner?.name && !owner.name.startsWith("user_") ? owner.name : "PG Owner";
  const ownerPhone = String((owner as any)?.phone || (owner as any)?.mobileContactNumber || "");
  const isDeletionPending = Boolean((owner as any)?.deletionRequestedAt);

  const planTitle = entitlements.isTrial
    ? `Pro Trial (${Math.max(0, entitlements.daysRemaining)}d left)`
    : entitlements.isPro
      ? "Pro Plan"
      : "Lite Plan";
  const planSub = entitlements.isPro || entitlements.isTrial
    ? "All premium capabilities enabled"
    : "Upgrade for Aadhaar KYC, Staff Roles & Reports";

  const manageRows: Array<{ title: string; sub: string; tone: IconTone; icon: React.ReactNode; to: string; dangerIcon?: boolean }> = [
    { title: "Staff Management", sub: "Manage your team & roles", tone: "blue", icon: <UserCog className="h-5 w-5" />, to: "/team" },
    { title: "Complaints", sub: "Manage tenant issues", tone: "red", icon: <MessageSquareWarning className="h-5 w-5" />, to: "/complaints", dangerIcon: true },
    { title: "Announcement", sub: "Broadcast updates to all tenants", tone: "violet", icon: <Megaphone className="h-5 w-5" />, to: "/my-pgs/notices" },
    { title: "KYC & Topup Credits", sub: "Buy credits for KYC verifications", tone: "amber", icon: <CreditCard className="h-5 w-5" />, to: "/tenants/kyc" },
    { title: "Activity Audit Trail", sub: "View system action logs & history", tone: "indigo", icon: <History className="h-5 w-5" />, to: "/activity-logs" },
    { title: "Settlement Accounts & UPI", sub: "Manage bank accounts & UPI", tone: "green", icon: <Landmark className="h-5 w-5" />, to: "/my-pgs/bank" },
    { title: "Expenses", sub: "Track bills & maintenance costs", tone: "rose", icon: <Receipt className="h-5 w-5" />, to: "/expenses" },
    { title: "Inventory & Assets", sub: "Track rooms & appliances", tone: "sky", icon: <Package className="h-5 w-5" />, to: "/settings/inventory" },
    { title: "Refer & Earn", sub: "Invite PG owners to PG Ease", tone: "orange", icon: <Gift className="h-5 w-5" />, to: "/referrals" },
    { title: "Tutorials & Guides", sub: "Learn how to use PG Ease", tone: "emerald", icon: <BookOpen className="h-5 w-5" />, to: "/support" },
    { title: "Settings & Notification Preferences", sub: "Profile, payouts, rules & alerts", tone: "teal", icon: <Settings className="h-5 w-5" />, to: "/settings" },
  ];

  return (
    <PageScaffold
      isOffline={isOffline}
      lastUpdated={lastUpdated}
      header={
        <MobileAppHeader
          showPgSwitcher={true}
          title="Account & Settings"
          className="pb-14"
          rightActions={
            <button
              type="button"
              onClick={toggleDark}
              className="h-10 w-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white cursor-pointer"
              aria-label="Toggle dark mode"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          }
        />
      }
    >
      <div className="px-4 -mt-10 space-y-5">
        {/* Profile + Premium Plan Combined Hero Card */}
        <MobileCard className="p-0 overflow-hidden">
          <button
            type="button"
            onClick={() => navigate("/settings")}
            className="w-full p-4 flex items-center gap-3 text-left cursor-pointer"
          >
            <Avatar name={ownerName} src={(owner as any)?.profilePhotoUrl} size={52} />
            <div className="min-w-0 flex-1">
              <div className="text-[16px] font-semibold text-[var(--ms-ink)] truncate">{ownerName}</div>
              <div className="flex items-center gap-1.5 text-[12px] text-[var(--ms-ink-3)] mt-0.5">
                <Phone className="h-3.5 w-3.5" />
                <span>{ownerPhone || "Owner Account"}</span>
              </div>
            </div>
          </button>

          <div className="ms-premium-gradient text-white px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-[var(--ms-premium-gold)]">
                <Crown className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold truncate text-[var(--ms-premium-gold)]">{planTitle}</div>
                <div className="text-[11px] text-white/80 truncate">{planSub}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate("/plans")}
              className="shrink-0 px-3.5 py-1.5 rounded-full bg-white text-[var(--ms-brand-800)] text-[12px] font-semibold cursor-pointer active:scale-95 transition-transform"
            >
              {entitlements.isPro || entitlements.isTrial ? "Manage →" : "Upgrade →"}
            </button>
          </div>
        </MobileCard>

        {/* Manage List */}
        <section className="space-y-2.5">
          <SectionHeader title="Manage" />
          <MobileCard className="p-0 overflow-hidden divide-y divide-[var(--ms-divider)]">
            {manageRows.map((row) => (
              <ListRow
                key={row.title}
                tone={row.tone}
                icon={row.icon}
                title={row.title}
                subtitle={row.sub}
                danger={row.dangerIcon}
                onClick={() => navigate(row.to)}
              />
            ))}
          </MobileCard>
        </section>

        {/* Help & Support List */}
        <section className="space-y-2.5">
          <SectionHeader title="Help & Support" />
          <MobileCard className="p-0 overflow-hidden divide-y divide-[var(--ms-divider)]">
            <ListRow
              tone="blue"
              icon={<HelpCircle className="h-5 w-5" />}
              title="Help & Support"
              subtitle="WhatsApp & Call +91 77019 53356"
              onClick={() => navigate("/support")}
            />
            <ListRow
              tone="amber"
              icon={<Bell className="h-5 w-5" />}
              title="Notifications"
              subtitle="View alerts & updates"
              onClick={() => navigate("/notifications")}
            />
            <ListRow
              tone="indigo"
              icon={<FileText className="h-5 w-5" />}
              title="Terms & Conditions"
              onClick={() => navigate("/terms-and-conditions")}
            />
            <ListRow
              tone="teal"
              icon={<Shield className="h-5 w-5" />}
              title="Privacy Policy"
              onClick={() => navigate("/privacy-policy")}
            />
            {import.meta.env.DEV && (
              <ListRow
                tone="violet"
                icon={<Crown className="h-5 w-5" />}
                title="UI Component Gallery (Dev)"
                subtitle="Preview Phase 1 design system"
                onClick={() => navigate("/__gallery")}
              />
            )}
            <ListRow
              icon={<Trash2 className="h-5 w-5" />}
              title="Delete Account"
              subtitle={isDeletionPending ? "Request Pending" : "Permanently remove owner account"}
              danger
              onClick={() => navigate("/settings")}
            />
          </MobileCard>
        </section>

        {/* Outlined Logout Button */}
        <DangerButton type="button" onClick={() => setLogoutOpen(true)} className="w-full">
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </DangerButton>

        {/* Branded Footer */}
        <div className="flex flex-col items-center justify-center text-center pt-2 pb-1 gap-1.5">
          <img src={pgeaseIconColor} alt="PG Ease" className="h-10 w-10 rounded-xl shadow-xs bg-white p-0.5" />
          <div className="text-[13px] font-semibold text-[var(--ms-ink)]">PG Ease Owner</div>
          <div className="text-[11px] text-[var(--ms-ink-3)]">
            v{appVersion} · Made with ♥ for PG owners
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        title="Log out of PG Ease?"
        description="You will need to verify your mobile number via OTP to sign back in."
        confirmLabel="Logout"
        destructive
        onConfirm={() => performLogout("manual")}
      />
    </PageScaffold>
  );
}
