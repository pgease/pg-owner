import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Building2,
  Calendar,
  ChevronDown,
  MapPin,
  Plus,
  Search,
  Settings,
  Shield,
  TriangleAlert,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useDashboardData } from "@/components/dashboard/useDashboardData";
import { useMonthlyOwnerKpis } from "@/hooks/usePropertyOwnerQueries";
import { useOwnerNotifications } from "@/hooks/useOwnerNotifications";
import { formatInr } from "@/lib/rentDashboard";
import { cn } from "@/lib/utils";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const QUICK_ACTIONS = [
  { label: "Add tenant", to: "/tenants/add" },
  { label: "Record rent payment", to: "/rent-payments" },
  { label: "View tenants", to: "/tenants" },
  { label: "Complaints", to: "/complaints" },
  { label: "Verify KYC", to: "/tenants/kyc" },
  { label: "My PG", to: "/my-pgs" },
  { label: "Add room or bed", to: "/my-pgs/structure" },
  { label: "Settings", to: "/settings" },
];

function dashValue(value: string | number | undefined | null, loading?: boolean) {
  if (loading) return "—";
  if (value === undefined || value === null || value === "") return "—";
  return value;
}

export function MobileDashboard() {
  const navigate = useNavigate();
  const { properties, selectedPgId, setSelectedPgId } = useApp();
  const list = Array.isArray(properties) ? properties : [];
  const selectedPg = list.find((p) => p.id === selectedPgId);
  const data = useDashboardData(selectedPgId);
  const kpis = useMonthlyOwnerKpis(selectedPgId, data.rent.month, data.rent.year);
  const { unreadCount } = useOwnerNotifications();

  const [query, setQuery] = useState("");
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const filteredActions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return QUICK_ACTIONS.filter((a) => a.label.toLowerCase().includes(q));
  }, [query]);

  const monthName = MONTHS[data.rent.month - 1] ?? "";
  const newJoins = kpis.data?.headlineNumbers?.moveIns?.count;
  const rentDue = data.rent.pendingAmount;
  const complaintsCount = data.complaints.open + data.complaints.inProgress;
  const vacantBeds = data.beds.vacantBeds;
  const tenantTotal = data.tenants.total;

  return (
    <div className="md:hidden -mx-0 min-h-full bg-[var(--figma-dash-header-bg,#F0FFFF)]">
      <header
        className="bg-[var(--figma-dash-header-bg,#F0FFFF)] px-4 pb-3"
        style={{ paddingTop: "calc(var(--safe-top) + 8px)" }}
      >
        <div className="flex items-start justify-between gap-3">
          <button
            type="button"
            className="flex min-w-0 flex-1 items-start gap-2.5 !h-auto !min-h-0 rounded-xl py-1 text-left"
            onClick={() => setSwitcherOpen((v) => !v)}
            aria-expanded={switcherOpen}
            aria-haspopup="listbox"
          >
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#D9F3F3] text-[#184040]">
              <Building2 className="h-5 w-5" strokeWidth={2} />
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-1">
                <span className="truncate text-[18px] font-semibold leading-6 text-[#101010]">
                  {selectedPg?.name ?? "Select a PG"}
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-[#101010]" />
              </span>
              <span className="mt-0.5 flex items-center gap-1 text-[12px] leading-4 text-[#636363]">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">
                  {selectedPg?.address || "Add your property address"}
                </span>
              </span>
            </span>
          </button>

          <div className="flex shrink-0 items-center gap-2 pt-0.5">
            <button
              type="button"
              className="relative flex h-11 w-11 items-center justify-center rounded-full border border-[#E4EEEE] bg-white text-[#101010]"
              aria-label="Notifications"
              onClick={() => navigate("/notifications")}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 ? (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#FF3D00]" />
              ) : null}
            </button>
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[#E4EEEE] bg-white text-[#101010]"
              aria-label="Settings"
              onClick={() => navigate("/settings")}
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>

        {switcherOpen ? (
          <ul
            className="mt-3 max-h-56 overflow-y-auto rounded-2xl border border-[#E5E5E5] bg-white p-1.5 shadow-sm"
            role="listbox"
          >
            {list.map((pg) => (
              <li key={pg.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={pg.id === selectedPgId}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[14px] font-medium",
                    pg.id === selectedPgId ? "bg-[#E8FFFF] text-[#008080]" : "text-[#101010]",
                  )}
                  onClick={() => {
                    setSelectedPgId(pg.id);
                    setSwitcherOpen(false);
                  }}
                >
                  <Building2 className="h-4 w-4 shrink-0" />
                  <span className="truncate">{pg.name}</span>
                </button>
              </li>
            ))}
            {list.length === 0 ? (
              <li className="px-3 py-2 text-[13px] text-[#636363]">No properties yet</li>
            ) : null}
          </ul>
        ) : null}
      </header>

      <div className="bg-[var(--figma-dash-banner,#184040)] px-4 py-2.5 text-center text-[12px] font-medium leading-4 text-white">
        Manage tenants, rent, and issues in one app.
      </div>

      <section className="bg-[var(--figma-dash-hero,#F2FEFE)] px-4 pb-5 pt-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9E9E9E]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for Quick Actions"
            aria-label="Search for Quick Actions"
            className="h-12 w-full rounded-2xl border border-[#E5E5E5] bg-white pl-10 pr-3 text-[16px] text-[#101010] placeholder:text-[#9E9E9E] outline-none focus:border-[#008080] focus:ring-0"
          />
          {filteredActions.length > 0 ? (
            <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-[#E5E5E5] bg-white shadow-md">
              {filteredActions.map((action) => (
                <li key={action.to}>
                  <button
                    type="button"
                    className="flex h-11 w-full items-center px-3 text-left text-[14px] text-[#101010]"
                    onClick={() => {
                      setQuery("");
                      navigate(action.to);
                    }}
                  >
                    {action.label}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="mt-8 flex flex-col items-center text-center">
          <div className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#101010]">
            <Users className="h-4 w-4" />
            Total Tenants
          </div>
          <p className="mt-2 text-[56px] font-medium leading-none tabular-nums text-[#101010]">
            {dashValue(tenantTotal, data.loading.tenants)}
          </p>
          <p className="mt-2 text-[13px] leading-5 text-[#636363]">
            Vacant Beds: {dashValue(vacantBeds, data.loading.rooms)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate(selectedPgId ? "/tenants/add" : "/onboarding")}
          className="mt-6 flex h-[52px] w-full items-center justify-center gap-2 rounded-[40px] border border-dashed border-[#A7D5D5] bg-transparent text-[16px] font-medium text-[#101010]"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#101010] text-white">
            <Plus className="h-3 w-3" strokeWidth={3} />
          </span>
          {selectedPgId ? "Add Your First Resident" : "Add your first property"}
        </button>
      </section>

      <section className="bg-[var(--figma-dash-summary,#F5F6FA)] px-4 pb-6 pt-5">
        <h2 className="text-[16px] font-semibold leading-6 text-[#101010]">Current Month Summary</h2>
        <p className="mt-1 flex items-center gap-1.5 text-[12px] text-[#636363]">
          <Calendar className="h-3.5 w-3.5" />
          {monthName} {data.rent.year}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <SummaryCard
            icon={<Wallet className="h-4 w-4" />}
            label="Rent Due"
            value={
              rentDue === undefined && data.loading.rent
                ? "—"
                : rentDue === undefined
                  ? "—"
                  : formatInr(rentDue)
            }
            onClick={() => navigate("/rent-payments")}
          />
          <SummaryCard
            icon={<UserPlus className="h-4 w-4" />}
            label="New Joins"
            value={dashValue(newJoins, kpis.isLoading)}
            onClick={() => navigate("/tenants")}
          />
          <SummaryCard
            icon={<TriangleAlert className="h-4 w-4" />}
            label="Complaints"
            value={dashValue(data.loading.complaints ? undefined : complaintsCount, data.loading.complaints)}
            onClick={() => navigate("/complaints")}
          />
          <SummaryCard
            icon={<Shield className="h-4 w-4" />}
            label="Pending Security"
            value="—"
            onClick={() => navigate("/tenants")}
          />
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[108px] flex-col items-start rounded-[16px] bg-white p-3.5 text-left !h-auto"
    >
      <span className="flex items-center gap-1.5 text-[12px] font-medium text-[#636363]">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E8FFFF] text-[#008080]">
          {icon}
        </span>
        {label}
      </span>
      <span className="mt-3 text-[22px] font-semibold leading-7 tabular-nums text-[#101010]">{value}</span>
    </button>
  );
}
