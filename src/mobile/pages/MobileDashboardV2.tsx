import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  BedDouble,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Coins,
  Crown,
  DoorOpen,
  FileSpreadsheet,
  FileText,
  IndianRupee,
  Info,
  Megaphone,
  MessageSquareWarning,
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
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
import { formatCount } from "@/mobile/utils/formatters";
import { NAV_REGISTRY, searchNavRegistry } from "@/mobile/navRegistry";
import { tokens, type IconTone } from "@/mobile/tokens";
import { MobileAppHeader } from "@/mobile/components/ui/MobileHeaders";
import { PageScaffold } from "@/mobile/components/ui/PageScaffold";
import {
  BottomSheet,
  IconTile,
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
  const [countInfoOpen, setCountInfoOpen] = useState(false);

  const list = Array.isArray(properties) ? properties : [];
  const headline = kpis.data?.headlineNumbers;

  const monthlyRevenue = headline?.collected?.value ?? summary.collectedThisMonth;
  const moveIns = headline?.moveIns?.count ?? 0;
  const moveOuts = headline?.moveOuts?.count ?? 0;

  const creditsRemaining = summary.remainingCredits ?? 0;
  const isLowCredits = creditsRemaining <= tokens.lowCreditsThreshold;

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

  const quickActions: Array<{
    id: string;
    label: string;
    icon: React.ReactNode;
    tone: IconTone;
    to: string;
    requiresOnline?: boolean;
  }> = [
    { id: "add-tenant", label: "Add Tenant", icon: <UserPlus className="h-5 w-5" />, tone: "teal", to: "/tenants/add", requiresOnline: true },
    { id: "announcement", label: "Announcement", icon: <Megaphone className="h-5 w-5" />, tone: "violet", to: "/my-pgs/notices" },
    { id: "due-reminder", label: "Due Reminder", icon: <Clock className="h-5 w-5" />, tone: "amber", to: "/rent-payments/dues" },
    { id: "collect-rent", label: "Collect Rent", icon: <IndianRupee className="h-5 w-5" />, tone: "green", to: "/rent-payments" },
    { id: "food-menu", label: "Food Menu", icon: <UtensilsCrossed className="h-5 w-5" />, tone: "orange", to: "/food" },
    { id: "add-staff", label: "Add Staff", icon: <Users className="h-5 w-5" />, tone: "blue", to: "/team/add-staff", requiresOnline: true },
  ];

  const desktopDropdownExtras: Array<{
    label: string;
    subtitle: string;
    to: string;
    tone: IconTone;
    icon: React.ReactNode;
  }> = [
    { label: "Record rent payment", subtitle: "Cash / UPI / Bank Transfer", to: "/rent-payments", tone: "green", icon: <IndianRupee className="h-5 w-5" /> },
    { label: "PG Layout & Beds", subtitle: "Blocks, floors & bed grid", to: "/my-pgs/structure", tone: "teal", icon: <BedDouble className="h-5 w-5" /> },
    { label: "Verify KYC", subtitle: "Aadhaar e-KYC & agreements", to: "/tenants/kyc", tone: "amber", icon: <ShieldCheck className="h-5 w-5" /> },
    { label: "View complaints", subtitle: "Open maintenance tickets", to: "/complaints", tone: "red", icon: <MessageSquareWarning className="h-5 w-5" /> },
    { label: "Expenses", subtitle: "Track bills & payouts", to: "/expenses", tone: "rose", icon: <TrendingUp className="h-5 w-5" /> },
    { label: "Subscription & Plans", subtitle: "Manage plan & billing", to: "/plans", tone: "indigo", icon: <Crown className="h-5 w-5" /> },
  ];

  const alertCards: Array<{
    id: string;
    count: number;
    label: string;
    helper: string;
    tone: IconTone;
    borderClass: string;
    bgClass: string;
    icon: React.ReactNode;
    to: string;
  }> = [];

  if (summary.kycPendingTenants > 0) {
    alertCards.push({
      id: "kyc",
      count: summary.kycPendingTenants,
      label: "Pending KYC",
      helper: "Tap to review & verify resident Aadhaar KYC",
      tone: "amber",
      borderClass: "border-l-4 border-l-[var(--ms-pending-icon)] border-[var(--ms-pending-border)]",
      bgClass: "bg-[var(--ms-pending-bg)]/45",
      icon: <ShieldCheck className="h-5 w-5" />,
      to: "/tenants?kyc=pending",
    });
  }
  if (summary.totalOpenTickets > 0) {
    alertCards.push({
      id: "tickets",
      count: summary.totalOpenTickets,
      label: "Open Tickets",
      helper: "Tenant complaints awaiting resolution",
      tone: "red",
      borderClass: "border-l-4 border-l-[var(--ms-error-icon)] border-[var(--ms-error-border)]",
      bgClass: "bg-[var(--ms-error-bg)]/45",
      icon: <AlertCircle className="h-5 w-5" />,
      to: "/complaints",
    });
  }
  if (summary.unpaidTenantsCount > 0) {
    alertCards.push({
      id: "dues",
      count: summary.unpaidTenantsCount,
      label: "Rent Overdue / Due",
      helper: "Residents with pending rent this month",
      tone: "red",
      borderClass: "border-l-4 border-l-[var(--ms-error-icon)] border-[var(--ms-error-border)]",
      bgClass: "bg-[var(--ms-error-bg)]/45",
      icon: <IndianRupee className="h-5 w-5" />,
      to: "/rent-payments/dues",
    });
  }

  return (
    <PageScaffold
      isOffline={isOffline}
      lastUpdated={lastUpdated}
      onRefresh={refetchAll}
      header={<MobileAppHeader />}
    >
      <div className="ms-header-gradient px-4 pt-1 pb-7">
        <div className="flex items-center gap-2 overflow-x-auto ms-no-scrollbar">
          <StatusChip
            tone={summary.kycPendingTenants > 0 ? "pending" : "success"}
            icon={summary.kycPendingTenants > 0 ? <Clock className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
            label={summary.kycPendingTenants > 0 ? `${summary.kycPendingTenants} KYC Pending` : "KYC Verified"}
            onClick={() => navigate("/tenants/kyc")}
          />
          <StatusChip
            tone={entitlements.isPro || entitlements.isTrial ? "premium" : "neutral"}
            icon={<Crown className="h-3 w-3" />}
            label={planChipLabel}
            onClick={() => navigate("/plans")}
          />
          <StatusChip
            tone={isLowCredits ? "error" : "teal"}
            icon={<Coins className="h-3 w-3" />}
            label={
              creditsRemaining === 0
                ? "No credits · Top up"
                : isLowCredits
                  ? `${creditsRemaining} Credits · Top up`
                  : `${creditsRemaining} Credits`
            }
            onClick={() => navigate("/tenants/kyc")}
          />
        </div>
      </div>
      <div className="px-4 -mt-4 space-y-5">
        {isError ? (
          <MobileCard>
            <MascotErrorState onRetry={() => void refetchAll()} />
          </MobileCard>
        ) : (
          <>
            {/* Occupancy Hero Card — Consistent Bed & Resident Definitions (C6.4) */}
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
                      <div className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--ms-ink-3)]">
                        <span>Occupied Beds</span>
                        {summary.totalTenants !== summary.occupiedBeds && (
                          <button
                            type="button"
                            onClick={() => setCountInfoOpen(true)}
                            className="inline-flex items-center text-[var(--ms-brand-text)] cursor-pointer"
                            aria-label="Why occupied beds and residents differ"
                          >
                            <Info className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="text-[32px] font-semibold leading-tight text-[var(--ms-ink)] tabular-nums">
                        {formatCount(summary.occupiedBeds)}
                      </div>
                      <div className="text-[12px] text-[var(--ms-ink-3)]">
                        across {formatCount(summary.totalBeds)} total beds · {formatCount(summary.totalTenants)} residents
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
                      className="rounded-full px-4 h-11 min-h-[44px] text-[13px]"
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
                  tone="green"
                  icon={<IndianRupee className="h-5 w-5" />}
                  value={<MoneyText amount={monthlyRevenue} compact />}
                  label="Monthly Revenue"
                  onClick={() => navigate("/rent-payments")}
                />
                <StatTile
                  tone="teal"
                  icon={<Users className="h-5 w-5" />}
                  value={formatCount(summary.occupiedBeds)}
                  label="Occupied Beds"
                  onClick={() => navigate("/tenants")}
                />
                <StatTile
                  tone="blue"
                  icon={<BedDouble className="h-5 w-5" />}
                  value={formatCount(summary.vacantBeds)}
                  label="Vacant Beds"
                  onClick={() => navigate("/my-pgs/structure")}
                />
                <StatTile
                  tone="red"
                  icon={<MessageSquareWarning className="h-5 w-5" />}
                  value={formatCount(summary.totalOpenTickets)}
                  label="Complaints"
                  onClick={() => navigate("/complaints")}
                />
                <StatTile
                  tone="amber"
                  icon={<ShieldCheck className="h-5 w-5" />}
                  value={formatCount(summary.kycPendingTenants)}
                  label="Pending KYC"
                  onClick={() => navigate("/tenants/kyc")}
                />
                <StatTile
                  tone="indigo"
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
                  tone="indigo"
                  icon={<DoorOpen className="h-5 w-5" />}
                  value={formatCount(summary.totalRooms)}
                  label="Total Rooms"
                  onClick={() => navigate("/my-pgs/structure")}
                />
                <StatTile
                  tone="blue"
                  icon={<BedDouble className="h-5 w-5" />}
                  value={formatCount(summary.vacantBeds)}
                  label="Vacant Beds"
                  onClick={() => navigate("/my-pgs/structure")}
                />
                <StatTile
                  tone="teal"
                  icon={<Users className="h-5 w-5" />}
                  value={formatCount(summary.occupiedBeds)}
                  label="Occupied Beds"
                  onClick={() => navigate("/tenants")}
                />
                <StatTile
                  tone="sky"
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
                    <IconTile icon={qa.icon} tone={qa.tone} size="md" />
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
                  { title: "Excel Export", sub: "All tenant data", tone: "green" as IconTone, icon: <FileSpreadsheet className="h-5 w-5" />, to: "/reports/export" },
                  { title: "PDF Report", sub: "Formatted report", tone: "red" as IconTone, icon: <FileText className="h-5 w-5" />, to: "/reports" },
                  { title: "Monthly Report", sub: "Summary & stats", tone: "blue" as IconTone, icon: <TrendingUp className="h-5 w-5" />, to: "/reports/payments" },
                ].map((rep) => (
                  <button
                    key={rep.title}
                    type="button"
                    onClick={() => navigate(rep.to)}
                    className="ms-tile shrink-0 w-[142px] p-3.5 text-left flex flex-col gap-2 active:scale-[0.98] transition-transform cursor-pointer"
                  >
                    <IconTile icon={rep.icon} tone={rep.tone} size="md" className="h-9 w-9" />
                    <div>
                      <div className="text-[13px] font-semibold text-[var(--ms-ink)]">{rep.title}</div>
                      <div className="text-[11px] text-[var(--ms-ink-3)]">{rep.sub}</div>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Alerts — Full-width Stacked Cards (C1.3) */}
            <section className="space-y-2.5">
              <SectionHeader title="Alerts" />
              {alertCards.length === 0 ? (
                <div className="ms-tile p-3.5 flex items-center gap-3 border-l-4 border-l-[var(--ms-success-icon)] bg-[var(--ms-success-bg)]/45">
                  <IconTile icon={<CheckCircle2 className="h-5 w-5" />} tone="green" size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-semibold text-[var(--ms-ink)]">All clear</div>
                    <div className="text-[12px] text-[var(--ms-ink-3)]">No pending KYC, complaints, or overdue rent.</div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {alertCards.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => navigate(a.to)}
                      className={`ms-tile w-full min-h-[68px] p-3.5 flex items-center gap-3 text-left ${a.borderClass} ${a.bgClass} active:scale-[0.99] transition-transform cursor-pointer`}
                    >
                      <IconTile icon={a.icon} tone={a.tone} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-[20px] font-semibold leading-none text-[var(--ms-ink)] tabular-nums">
                            {formatCount(a.count)}
                          </span>
                          <span className="text-[14px] font-semibold text-[var(--ms-ink)] truncate">{a.label}</span>
                        </div>
                        <div className="text-[12px] text-[var(--ms-ink-3)] truncate mt-1">{a.helper}</div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-[var(--ms-ink-3)] shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {/* Count Explanation Sheet (C6.4) */}
      <BottomSheet open={countInfoOpen} onClose={() => setCountInfoOpen(false)} title="Occupancy & Residents Count">
        <div className="space-y-2.5 text-[13px] text-[var(--ms-ink-2)] leading-relaxed">
          <p>
            <strong>Occupied Beds ({formatCount(summary.occupiedBeds)})</strong> comes from your room &amp; bed layout across{" "}
            {formatCount(summary.totalBeds)} total beds ({summary.occupancyPct}% full).
          </p>
          <p>
            <strong>Residents ({formatCount(summary.totalTenants)})</strong> is the number of active tenant profiles registered in this PG.
            Beds marked occupied without an active tenant profile (e.g., reserved/blocked or staff beds) account for the difference.
          </p>
          <PrimaryButton type="button" className="w-full mt-2" onClick={() => setCountInfoOpen(false)}>
            Got it
          </PrimaryButton>
        </div>
      </BottomSheet>

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
                    tone="teal"
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
                  tone="blue"
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

      {/* More Quick Actions Sheet */}
      <BottomSheet open={moreActionsOpen} onClose={() => setMoreActionsOpen(false)} title="All Quick Actions">
        <div className="divide-y divide-[var(--ms-divider)] rounded-2xl border border-[var(--ms-border)] overflow-hidden">
          {desktopDropdownExtras.map((item) => (
            <ListRow
              key={item.label}
              tone={item.tone}
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
