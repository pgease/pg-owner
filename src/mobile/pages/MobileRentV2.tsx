import React, { useMemo, useState } from "react";
import { Bell, History, Plus, Search } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { usePropertySummary } from "@/mobile/hooks/usePropertySummary";
import { useNetworkStatus } from "@/mobile/hooks/useNetworkStatus";
import { formatINR } from "@/mobile/utils/formatters";
import { MobileAppHeader } from "@/mobile/components/ui/MobileHeaders";
import { PageScaffold } from "@/mobile/components/ui/PageScaffold";
import {
  FilterChips,
  MobileCard,
  MoneyText,
  SectionHeader,
  SegmentedTabs,
  StatusChip,
} from "@/mobile/components/ui/Primitives";
import { MascotEmptyState } from "@/mobile/components/ui/MascotStates";
import { toast } from "@/components/ui/use-toast";

export type RentMobileSubTab = "recent" | "register" | "review" | "dues" | "history";

export function MobileRentHeaderSection({
  collectedToday,
  monthlyRevenue,
  activeSubTab,
  onChangeSubTab,
  reviewCount,
  duesCount,
  onReceiveClick,
  onSendRemindersClick,
  transactions = [],
  onOpenLegacySection,
}: {
  collectedToday: number;
  monthlyRevenue: number;
  activeSubTab: RentMobileSubTab;
  onChangeSubTab: (t: RentMobileSubTab) => void;
  reviewCount: number;
  duesCount: number;
  onReceiveClick: () => void;
  onSendRemindersClick: () => void;
  transactions?: Array<{
    id: string;
    tenantName?: string;
    roomNumber?: string;
    amountPaid?: number | string;
    paymentMethod?: string;
    paymentDate?: string;
    status?: string;
  }>;
  onOpenLegacySection?: () => void;
}) {
  const { selectedPgId } = useApp();
  const { summary, refetchAll } = usePropertySummary(selectedPgId);
  const { isOffline, lastUpdated } = useNetworkStatus();

  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<"all" | "Cash" | "UPI" | "Bank Transfer">("all");

  const filteredTx = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions.filter((tx) => {
      if (methodFilter !== "all") {
        const m = String(tx.paymentMethod ?? "").toLowerCase();
        if (methodFilter === "Cash" && !m.includes("cash")) return false;
        if (methodFilter === "UPI" && !m.includes("upi")) return false;
        if (methodFilter === "Bank Transfer" && !m.includes("bank")) return false;
      }
      if (!q) return true;
      return (
        String(tx.tenantName ?? "").toLowerCase().includes(q) ||
        String(tx.roomNumber ?? "").toLowerCase().includes(q)
      );
    });
  }, [transactions, search, methodFilter]);

  const guardOnline = (label: string, fn: () => void) => {
    if (isOffline) {
      toast({ title: "You're offline", description: `Connect to the internet to ${label}.` });
      return;
    }
    fn();
  };

  return (
    <div className="md:hidden">
      <PageScaffold
        isOffline={isOffline}
        lastUpdated={lastUpdated}
        onRefresh={refetchAll}
        className="pb-4"
        header={<MobileAppHeader className="pb-5" />}
      >
        <div className="px-4 -mt-2 space-y-4">
          {/* Teal Hero Revenue Card */}
          <div className="ms-header-gradient rounded-[20px] p-5 text-white shadow-lg">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] text-white/85 font-medium">Total Collected Today</span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-semibold">INR</span>
            </div>
            <div className="text-[32px] font-semibold leading-tight mt-1 tabular-nums">
              {formatINR(collectedToday)}
            </div>

            <div className="flex items-end justify-between gap-3 mt-4 pt-3 border-t border-white/15">
              <div>
                <div className="text-[11px] text-white/75">Monthly Revenue</div>
                <div className="text-[18px] font-semibold tabular-nums mt-0.5">
                  {formatINR(monthlyRevenue || summary.collectedThisMonth)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => guardOnline("record a payment", onReceiveClick)}
                className="inline-flex items-center gap-1.5 px-4 h-11 rounded-2xl bg-white text-[#005F5F] text-[14px] font-semibold shadow-sm active:scale-95 transition-transform cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Receive</span>
              </button>
            </div>
          </div>

          {/* Two Action Cards (Teal Icons — NO Yellow!) */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => guardOnline("send reminders", onSendRemindersClick)}
              className="ms-tile p-4 text-left flex flex-col gap-3 active:scale-[0.98] transition-transform cursor-pointer"
            >
              <span className="h-10 w-10 rounded-xl bg-[var(--ms-brand-50)] text-[var(--ms-brand-text)] flex items-center justify-center">
                <Bell className="h-5 w-5" />
              </span>
              <span className="text-[14px] font-semibold text-[var(--ms-ink)]">Send Reminders</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onChangeSubTab("history");
                onOpenLegacySection?.();
              }}
              className="ms-tile p-4 text-left flex flex-col gap-3 active:scale-[0.98] transition-transform cursor-pointer"
            >
              <span className="h-10 w-10 rounded-xl bg-[var(--ms-brand-50)] text-[var(--ms-brand-text)] flex items-center justify-center">
                <History className="h-5 w-5" />
              </span>
              <span className="text-[14px] font-semibold text-[var(--ms-ink)]">Payment History</span>
            </button>
          </div>

          {/* Scrollable Segmented Tabs preserving ALL existing Rent screens */}
          <SegmentedTabs
            tabs={[
              { id: "recent", label: "Recent" },
              { id: "register", label: "Monthly Register" },
              { id: "review", label: "To be reviewed", badge: reviewCount },
              { id: "dues", label: "Dues & Pending", badge: duesCount },
              { id: "history", label: "Payment History" },
            ]}
            value={activeSubTab}
            onChange={onChangeSubTab}
          />

          {/* Recent Transactions Sub-Tab */}
          {activeSubTab === "recent" && (
            <section className="space-y-3">
              <SectionHeader title="Recent Transactions" />
              <div className="ms-tile h-11 px-3.5 flex items-center gap-2.5">
                <Search className="h-4 w-4 text-[var(--ms-ink-3)] shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tenant or room..."
                  className="w-full bg-transparent text-[13px] text-[var(--ms-ink)] placeholder:text-[var(--ms-placeholder)] focus:outline-none"
                />
              </div>
              <FilterChips
                items={[
                  { id: "all", label: "All" },
                  { id: "Cash", label: "Cash" },
                  { id: "UPI", label: "UPI" },
                  { id: "Bank Transfer", label: "Bank Transfer" },
                ]}
                value={methodFilter}
                onChange={setMethodFilter}
              />

              {filteredTx.length === 0 ? (
                <MobileCard>
                  <MascotEmptyState
                    variant="empty"
                    size="md"
                    title="No transactions found"
                    message="Your recent payments will appear here"
                  />
                </MobileCard>
              ) : (
                <div className="space-y-2.5">
                  {filteredTx.slice(0, 25).map((tx) => (
                    <MobileCard key={tx.id} className="p-3.5 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[14px] font-semibold text-[var(--ms-ink)] truncate">
                          {tx.tenantName || "Resident"}
                        </div>
                        <div className="text-[12px] text-[var(--ms-ink-3)] mt-0.5">
                          {tx.roomNumber ? `Room ${tx.roomNumber} · ` : ""}
                          {tx.paymentMethod || "Payment"}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <MoneyText amount={tx.amountPaid} className="text-[15px] font-semibold text-[var(--ms-success)]" />
                        <div className="mt-1">
                          <StatusChip label={tx.status || "Paid"} tone="success" />
                        </div>
                      </div>
                    </MobileCard>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </PageScaffold>
    </div>
  );
}
