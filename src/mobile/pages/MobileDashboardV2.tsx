import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  BedDouble,
  Building2,
  Calendar,
  Clock,
  Crown,
  DoorOpen,
  FileSpreadsheet,
  FileText,
  IndianRupee,
  Megaphone,
  MessageSquareWarning,
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useEntitlements } from "@/hooks/useEntitlements";
import { useMonthlyOwnerKpis } from "@/hooks/usePropertyOwnerQueries";
import { usePropertySummary } from "@/mobile/hooks/usePropertySummary";
import { useNetworkStatus } from "@/mobile/hooks/useNetworkStatus";
import { formatCount, formatINR } from "@/mobile/utils/formatters";
import { NAV_REGISTRY, searchNavRegistry } from "@/mobile/navRegistry";
import { MobileAppHeader } from "@/mobile/components/ui/MobileHeaders";
import { PageScaffold } from "@/mobile/components/ui/PageScaffold";
import {
  BottomSheet,
  ListRow,
  MobileCard,
  MoneyText,
  OccupancyRing,
  OutlineButton,
  PrimaryButton,
  SectionHeader,
  SkeletonBlock,
  StatTile,
  StatusChip,
} from "@/mobile/components/ui/Primitives";
import { MascotErrorState } from "@/mobile/components/ui/MascotStates";
import { toast } from "@/components/ui/use-toast";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function MobileDashboardV2() {
  const navigate = useNavigate();
  const { properties, selectedPgId } = useApp();
  const entitlements = useEntitlements();
  const { isOffline, lastUpdated } = useNetworkStatus();
  const { summary, tenants, isLoading, isError, refetchAll } = usePropertySummary(selectedPgId);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const kpis = useMonthlyOwnerKpis(selectedPgId, selectedMonth, selectedYear);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [moreActionsOpen, setMoreActionsOpen] = useState(false);

  const list = Array.isArray(properties) ? properties : [];
  const headline = kpis.data?.headlineNumbers;

  const monthlyRevenue = headline?.collected?.value ?? summary.collectedThisMonth;
  const moveIns = headline?.moveIns?.count ?? 0;
  const moveOuts = headline?.moveOuts?.count ?? 0;

  const planChipLabel = entitlements.isLoading
    ? "Plan"
    : entitlements.isExpired
      ? "Plan Expired"
      : entitlements.isTrial
        ? `Pro Trial · ${Math.max(0, entitlements.daysRemaining)}d`
        : entitlements.isPro
          ? "Pro Plan"
          : "Lite Plan";

  const guardOnline = (actionName: string, fn: () => void) => {
    if (isOffline) {
      toast({
        title: "You're offline",
        description: `Connect to the internet to ${actionName}.`,
      });
      return;
    }
    fn();
  };

  const searchResults = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return NAV_REGISTRY.slice(0, 8);
    return searchNavRegistry(q);
  }, [searchQuery]);

  const matchingTenants = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    return tenants
      .filter(
        (t) =>
          String(t.name ?? "").toLowerCase().includes(q) ||
          String((t as any).roomNumber ?? "").toLowerCase().includes(q) ||
          String((t as any).phone ?? "").includes(q),
      )
      .slice(0, 5);
  }, [searchQuery, tenants]);

  const quickActions = [
    { id: "add-tenant", label: "Add Tenant", icon: <UserPlus className="h-5 w-5" />, to: "/tenants/add", requiresOnline: true },
    { id: "announcement", label: "Announcement", icon: <Megaphone className="h-5 w-5" />, to: "/my-pgs/notices" },
    { id: "due-reminder", label: "Due Reminder", icon: <Clock className="h-5 w-5" />, to: "/rent-payments/dues" },
    { id: "collect-rent", label: "Collect Rent", icon: <IndianRupee className="h-5 w-5" />, to: "/rent-payments" },
    { id: "food-menu", label: "Food Menu", icon: <UtensilsCrossed className="h-5 w-5" />, to: "/food" },
    { id: "add-staff", label: "Add Staff", icon: <Users className="h-5 w-5" />, to: "/team/add-staff", requiresOnline: true },
  ];

  const desktopDropdownExtras = [
    { label: "Record rent payment", subtitle: "Cash / UPI / Bank Transfer", to: "/rent-payments", icon: <IndianRupee className="h-5 w-5" /> },
    { label: "Add room or bed", subtitle: "PG Layout & Bed Grid", to: "/my-pgs/structure", icon: <BedDouble className="h-5 w-5" /> },
    { label: "Verify KYC", subtitle: "Aadhaar e-KYC & agreements", to: "/tenants/kyc", icon: <ShieldCheck className="h-5 w-5" /> },
    { label: "View complaints", subtitle: "Open maintenance tickets", to: "/complaints", icon: <MessageSquareWarning className="h-5 w-5" /> },
    { label: "Expenses", subtitle: "Track bills & payouts", to: "/expenses", icon: <TrendingUp className="h-5 w-5" /> },
    { label: "Subscription & Plans", subtitle: "Manage plan & billing", to: "/plans", icon: <Crown className="h-5 w-5" /> },
  ];

  return (
    <PageScaffold
      isOffline={isOffline}
      lastUpdated={lastUpdated}
      onRefresh={refetchAll}
      header={
        <MobileAppHeader
          className="pb-10"
          row2={
            <div className="flex items-center gap-2 overflow-x-auto ms-no-scrollbar">
              <button
                type="button"
                onClick={() => navigate("/tenants/kyc")}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-white text-[11px] font-medium shrink-0 cursor-pointer"
              >
                <Clock className="h-3 w-3" />
                <span>{summary.kycPendingTenants > 0 ? "KYC Pending" : "KYC Verified"}</span>
              </button>
              <button
                type="button"
                onClick={() => navigate("/plans")}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-white text-[11px] font-medium shrink-0 cursor-pointer"
              >
                <Crown className="h-3 w-3" />
                <span>{planChipLabel}</span>
              </button>
              <button
                type="button"
                onClick={() => navigate("/tenants/kyc")}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-white text-[11px] font-medium shrink-0 cursor-pointer"
              >
                <Sparkles className="h-3 w-3" />
                <span>{summary.remainingCredits ?? 0} Credits</span>
              </button>
            </div>
          }
        />
      }
    >
      <div className="px-4 -mt-6 space-y-5">
        {isError ? (
          <MobileCard>
            <MascotErrorState onRetry={() => void refetchAll()} />
          </MobileCard>
        ) : (
          <>
            {/* Occupancy Hero Card */}
            <MobileCard className="space-y-4">
              {isLoading ? (
                <div className="space-y-3">
                  <SkeletonBlock className="h-16 w-full" />
                  <SkeletonBlock className="h-3 w-full" />
                  <SkeletonBlock className="h-10 w-full" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[12px] font-medium text-[var(--ms-ink-3)]">Total Tenants</div>
                      <div className="text-[32px] font-semibold leading-tight text-[var(--ms-ink)] tabular-nums">
                        {formatCount(summary.totalTenants)}
                      </div>
                      <div className="text-[12px] text-[var(--ms-ink-3)]">
                        across {formatCount(summary.totalBeds)} total beds
                      </div>
                    </div>
                    <OccupancyRing pct={summary.occupancyPct} />
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2.5 w-full rounded-full bg-[var(--ms-brand-50)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--ms-brand-600)] transition-all duration-500"
                      style={{ width: `${Math.min(100, summary.occupancyPct)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-[var(--ms-brand-600)]" />
                        <div>
                          <div className="text-[14px] font-semibold leading-none tabular-nums">
                            {formatCount(summary.occupiedBeds)}
                          </div>
                          <div className="text-[11px] text-[var(--ms-ink-3)]">Occupied</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-[var(--ms-brand-100)]" />
                        <div>
                          <div className="text-[14px] font-semibold leading-none tabular-nums">
                            {formatCount(summary.vacantBeds)}
                          </div>
                          <div className="text-[11px] text-[var(--ms-ink-3)]">Vacant</div>
                        </div>
                      </div>
                    </div>

                    <PrimaryButton
                      type="button"
                      onClick={() => guardOnline("add a tenant", () => navigate("/tenants/add"))}
                      className="rounded-full px-4 h-11 text-[13px]"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Tenant</span>
                    </PrimaryButton>
                  </div>
                </>
              )}
            </MobileCard>

            {/* Search Actions Bar */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="w-full ms-tile px-4 h-12 flex items-center gap-3 text-left text-[13px] text-[var(--ms-placeholder)] cursor-pointer"
            >
              <Search className="h-4 w-4 text-[var(--ms-ink-3)] shrink-0" />
              <span className="truncate">Search actions (rent, tenant, menu…)</span>
            </button>

            {/* Monthly Overview */}
            <section className="space-y-3">
              <SectionHeader
                title={`Monthly Overview · ${MONTHS[selectedMonth - 1]} ${selectedYear}`}
                actionLabel="View Reports"
                onAction={() => navigate("/reports")}
              />

              {/* Preserved Month/Year/Move-ins Toolbar */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1.5 bg-[var(--ms-card)] border border-[var(--ms-border)] rounded-xl px-2.5 h-9">
                  <Calendar className="h-3.5 w-3.5 text-[var(--ms-brand-text)]" />
                  <select
                    aria-label="Select Month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="bg-transparent text-[12px] font-medium text-[var(--ms-ink)] focus:outline-none"
                  >
                    {MONTHS.map((m, idx) => (
                      <option key={m} value={idx + 1}>{m.slice(0, 3)}</option>
                    ))}
                  </select>
                  <select
                    aria-label="Select Year"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="bg-transparent text-[12px] font-medium text-[var(--ms-ink)] focus:outline-none"
                  >
                    {[2024, 2025, 2026, 2027].map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-[var(--ms-card)] border border-[var(--ms-border)] text-[11px] font-medium text-[var(--ms-ink-3)]">
                  {kpis.data?.period?.daysInMonth ?? 30} days
                </span>

                <span className="px-2.5 py-1 rounded-full bg-[var(--ms-brand-50)] text-[var(--ms-brand-text)] text-[11px] font-medium">
                  {moveIns} Move ins · {moveOuts} Move outs
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <StatTile
                  icon={<IndianRupee className="h-5 w-5" />}
                  value={<MoneyText amount={monthlyRevenue} compact />}
                  label="Monthly Revenue"
                  onClick={() => navigate("/rent-payments")}
                />
                <StatTile
                  icon={<Users className="h-5 w-5" />}
                  value={formatCount(summary.occupiedBeds)}
                  label="Occupied Beds"
                  onClick={() => navigate("/tenants")}
                />
                <StatTile
                  icon={<BedDouble className="h-5 w-5" />}
                  value={formatCount(summary.vacantBeds)}
                  label="Vacant Beds"
                  onClick={() => navigate("/my-pgs/structure")}
                />
                <StatTile
                  icon={<MessageSquareWarning className="h-5 w-5" />}
                  iconBgClass="bg-[var(--ms-error-bg)] text-[var(--ms-error)]"
                  value={formatCount(summary.totalOpenTickets)}
                  label="Complaints"
                  onClick={() => navigate("/complaints")}
                />
                <StatTile
                  icon={<ShieldCheck className="h-5 w-5" />}
                  value={formatCount(summary.kycPendingTenants)}
                  label="Pending KYC"
                  onClick={() => navigate("/tenants/kyc")}
                />
                <StatTile
                  icon={<Building2 className="h-5 w-5" />}
                  value={formatCount(list.length)}
                  label="Properties"
                  onClick={() => navigate("/my-pgs")}
                />
              </div>
            </section>

            {/* Property Details */}
            <section className="space-y-3">
              <SectionHeader
                title="Property Details"
                actionLabel="Manage PG"
                onAction={() => navigate("/my-pgs")}
              />
              <div className="grid grid-cols-2 gap-3">
                <StatTile
                  icon={<DoorOpen className="h-5 w-5" />}
                  value={formatCount(summary.totalRooms)}
                  label="Total Rooms"
                  onClick={() => navigate("/my-pgs/structure")}
                />
                <StatTile
                  icon={<BedDouble className="h-5 w-5" />}
                  value={formatCount(summary.vacantBeds)}
                  label="Vacant Beds"
                  onClick={() => navigate("/my-pgs/structure")}
                />
                <StatTile
                  icon={<Users className="h-5 w-5" />}
                  value={formatCount(summary.occupiedBeds)}
                  label="Occupied Beds"
                  onClick={() => navigate("/tenants")}
                />
                <StatTile
                  icon={<Building2 className="h-5 w-5" />}
                  value={formatCount(summary.totalBeds)}
                  label="Total Beds"
                  onClick={() => navigate("/my-pgs/structure")}
                />
              </div>
              <OutlineButton type="button" onClick={() => navigate("/my-pgs")} className="w-full">
                <Building2 className="h-4 w-4" />
                <span>View Full Property Details</span>
              </OutlineButton>
            </section>

            {/* Quick Actions (3x2 Grid + More) */}
            <section className="space-y-3">
              <SectionHeader
                title="Quick Actions"
                actionLabel="More"
                onAction={() => setMoreActionsOpen(true)}
              />
              <div className="grid grid-cols-3 gap-2.5">
                {quickActions.map((qa) => (
                  <button
                    key={qa.id}
                    type="button"
                    onClick={() =>
                      qa.requiresOnline ? guardOnline(qa.label.toLowerCase(), () => navigate(qa.to)) : navigate(qa.to)
                    }
                    className="ms-tile p-3 flex flex-col items-center justify-center text-center gap-2 min-h-[96px] active:scale-[0.97] transition-transform cursor-pointer"
                  >
                    <span className="h-10 w-10 rounded-xl bg-[var(--ms-brand-50)] text-[var(--ms-brand-text)] flex items-center justify-center">
                      {qa.icon}
                    </span>
                    <span className="text-[12px] font-medium text-[var(--ms-ink)] leading-tight line-clamp-2">
                      {qa.label}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* Download Reports */}
            <section className="space-y-3">
              <SectionHeader title="Download Reports" />
              <div className="flex gap-3 overflow-x-auto ms-no-scrollbar pb-1">
                {[
                  { title: "Excel Export", sub: "All tenant data", icon: <FileSpreadsheet className="h-5 w-5" />, to: "/reports/export" },
                  { title: "PDF Report", sub: "Formatted report", icon: <FileText className="h-5 w-5" />, to: "/reports" },
                  { title: "Monthly Report", sub: "Summary & stats", icon: <TrendingUp className="h-5 w-5" />, to: "/reports/payments" },
                ].map((rep) => (
                  <button
                    key={rep.title}
                    type="button"
                    onClick={() => navigate(rep.to)}
                    className="ms-tile shrink-0 w-[142px] p-3.5 text-left flex flex-col gap-2 active:scale-[0.98] transition-transform cursor-pointer"
                  >
                    <span className="h-9 w-9 rounded-xl bg-[var(--ms-brand-50)] text-[var(--ms-brand-text)] flex items-center justify-center">
                      {rep.icon}
                    </span>
                    <div>
                      <div className="text-[13px] font-semibold text-[var(--ms-ink)]">{rep.title}</div>
                      <div className="text-[11px] text-[var(--ms-ink-3)]">{rep.sub}</div>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Alerts (Real counts only) */}
            {(summary.kycPendingTenants > 0 || summary.totalOpenTickets > 0 || summary.unpaidTenantsCount > 0) && (
              <section className="space-y-3">
                <SectionHeader title="Alerts" />
                <div className="flex flex-wrap gap-2.5">
                  {summary.kycPendingTenants > 0 && (
                    <StatusChip
                      tone="pending"
                      icon={<ShieldCheck className="h-3.5 w-3.5" />}
                      label={`${summary.kycPendingTenants} Pending KYC`}
                      onClick={() => navigate("/tenants/kyc")}
                    />
                  )}
                  {summary.totalOpenTickets > 0 && (
                    <StatusChip
                      tone="error"
                      icon={<AlertCircle className="h-3.5 w-3.5" />}
                      label={`${summary.totalOpenTickets} Open Tickets`}
                      onClick={() => navigate("/complaints")}
                    />
                  )}
                  {summary.unpaidTenantsCount > 0 && (
                    <StatusChip
                      tone="error"
                      icon={<IndianRupee className="h-3.5 w-3.5" />}
                      label={`${summary.unpaidTenantsCount} Rent Due`}
                      onClick={() => navigate("/rent-payments/dues")}
                    />
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* Search Actions & Tenants Sheet */}
      <BottomSheet open={searchOpen} onClose={() => setSearchOpen(false)} title="Search Actions & Tenants">
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-xl border border-[var(--ms-border)] bg-[var(--ms-page)] px-3 h-11">
            <Search className="h-4 w-4 text-[var(--ms-ink-3)]" />
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rent, kiraya, tenant, wifi, complaint..."
              className="w-full bg-transparent text-[14px] text-[var(--ms-ink)] placeholder:text-[var(--ms-placeholder)] focus:outline-none"
            />
          </div>

          {matchingTenants.length > 0 && (
            <div className="space-y-1">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ms-ink-3)] px-1">
                Tenants
              </div>
              <div className="divide-y divide-[var(--ms-divider)] rounded-2xl border border-[var(--ms-border)] overflow-hidden">
                {matchingTenants.map((t) => (
                  <ListRow
                    key={t.id}
                    icon={<Users className="h-5 w-5" />}
                    title={t.name || "Tenant"}
                    subtitle={`Room ${(t as any).roomNumber ?? "—"}`}
                    onClick={() => {
                      setSearchOpen(false);
                      navigate(`/tenants/${t.id}`);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ms-ink-3)] px-1">
              Screens & Actions
            </div>
            <div className="divide-y divide-[var(--ms-divider)] rounded-2xl border border-[var(--ms-border)] overflow-hidden">
              {searchResults.map((item) => (
                <ListRow
                  key={item.id}
                  icon={<MoreHorizontal className="h-5 w-5" />}
                  title={item.label}
                  subtitle={item.subtitle}
                  onClick={() => {
                    setSearchOpen(false);
                    navigate(item.route);
                  }}
                />
              ))}
              {searchResults.length === 0 && (
                <div className="p-4 text-center text-[13px] text-[var(--ms-ink-3)]">No matching actions found</div>
              )}
            </div>
          </div>
        </div>
      </BottomSheet>

      {/* More Quick Actions Sheet (Preserves all desktop dropdown items) */}
      <BottomSheet open={moreActionsOpen} onClose={() => setMoreActionsOpen(false)} title="All Quick Actions">
        <div className="divide-y divide-[var(--ms-divider)] rounded-2xl border border-[var(--ms-border)] overflow-hidden">
          {desktopDropdownExtras.map((item) => (
            <ListRow
              key={item.label}
              icon={item.icon}
              title={item.label}
              subtitle={item.subtitle}
              onClick={() => {
                setMoreActionsOpen(false);
                navigate(item.to);
              }}
            />
          ))}
        </div>
      </BottomSheet>
    </PageScaffold>
  );
}
