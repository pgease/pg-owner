import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, History, Plus, Search } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { usePropertySummary } from "@/mobile/hooks/usePropertySummary";
import { useNetworkStatus } from "@/mobile/hooks/useNetworkStatus";
import { formatINR } from "@/mobile/utils/formatters";
import { MobileAppHeader } from "@/mobile/components/ui/MobileHeaders";
import { PageScaffold } from "@/mobile/components/ui/PageScaffold";
import {
  ActiveFilterPills,
  Avatar,
  BottomSheet,
  FilterButton,
  FilterChips,
  IconTile,
  MobileCard,
  MoneyText,
  OutlineButton,
  PrimaryButton,
  SectionHeader,
  StatusChip,
  SwipeTabs,
} from "@/mobile/components/ui/Primitives";
import { MascotEmptyState } from "@/mobile/components/ui/MascotStates";
import { toast } from "@/components/ui/use-toast";

export type RentMobileSubTab = "recent" | "register" | "dues" | "review" | "history";

export function MobileRentHeaderSection({
  collectedToday,
  monthlyRevenue,
  activeSubTab,
  onChangeSubTab,
  reviewCount,
  duesCount,
  onReceiveClick,
  transactions = [],
}: {
  collectedToday: number;
  monthlyRevenue: number;
  activeSubTab: RentMobileSubTab;
  onChangeSubTab: (t: RentMobileSubTab) => void;
  reviewCount: number;
  duesCount: number;
  onReceiveClick: () => void;
  onSendRemindersClick?: () => void;
  transactions?: Array<{
    id: string;
    tenantName?: string;
    roomNumber?: string;
    amountPaid?: number | string;
    paymentMethod?: string;
    paymentDate?: string;
    paidAt?: string;
    createdAt?: string;
    status?: string;
    utrNumber?: string;
    receiptNumber?: string;
    notes?: string;
    collectedBy?: string;
  }>;
  onOpenLegacySection?: () => void;
}) {
  const navigate = useNavigate();
  const { selectedPgId } = useApp();
  const { summary, refetchAll } = usePropertySummary(selectedPgId);
  const { isOffline, lastUpdated } = useNetworkStatus();

  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<"all" | "Cash" | "UPI" | "Bank Transfer">("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftMethod, setDraftMethod] = useState<"all" | "Cash" | "UPI" | "Bank Transfer">("all");
  const [selectedTx, setSelectedTx] = useState<(typeof transactions)[number] | null>(null);

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

  const primaryTabs: Array<{ id: "recent" | "register" | "dues" | "review"; label: string; badge?: number }> = [
    { id: "recent", label: "Recent" },
    { id: "register", label: "Register" },
    { id: "dues", label: "Dues", badge: duesCount },
    { id: "review", label: "Review", badge: reviewCount },
  ];

  return (
    <div className="md:hidden">
      <PageScaffold
        isOffline={isOffline}
        lastUpdated={lastUpdated}
        onRefresh={refetchAll}
        className="pb-3"
        header={<MobileAppHeader title="Rent" />}
      >
        <div className="px-4 pt-4 space-y-4">
          {/* Teal Hero Revenue Card — Clean overlap, NO INR badge */}
          <div className="ms-header-gradient rounded-[20px] p-5 text-white shadow-lg">
            <div className="text-[13px] text-white/85 font-medium">Total Collected Today</div>
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
                className="inline-flex items-center gap-1.5 px-4 h-10 min-h-[44px] rounded-2xl bg-white text-[var(--ms-brand-800)] text-[14px] font-semibold shadow-sm active:scale-95 transition-transform cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Receive</span>
              </button>
            </div>
          </div>

          {/* Two Action Cards: Send Reminders (dedicated flow) & Payment History */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => guardOnline("send reminders", () => navigate("/rent-payments/reminders"))}
              className="ms-tile p-4 text-left flex flex-col gap-3 active:scale-[0.98] transition-transform cursor-pointer"
            >
              <IconTile icon={<Bell className="h-5 w-5" />} tone="amber" size="md" />
              <span className="text-[14px] font-semibold text-[var(--ms-ink)]">Send Reminders</span>
            </button>

            <button
              type="button"
              onClick={() => onChangeSubTab("history")}
              className="ms-tile p-4 text-left flex flex-col gap-3 active:scale-[0.98] transition-transform cursor-pointer"
            >
              <IconTile icon={<History className="h-5 w-5" />} tone="indigo" size="md" />
              <span className="text-[14px] font-semibold text-[var(--ms-ink)]">Payment History</span>
            </button>
          </div>

          {/* R5: Shared SwipeTabs (Recent / Register / Dues / Review) */}
          <SwipeTabs
            tabs={primaryTabs}
            value={activeSubTab === "history" ? ("recent" as const) : activeSubTab}
            onChange={(id) => onChangeSubTab(id)}
          >
            {/* Recent Transactions Sub-Tab */}
            {activeSubTab === "recent" && (
              <section className="space-y-3">
                <SectionHeader title="Recent Transactions" />
                <div className="flex items-center gap-2">
                  <div className="flex-1 ms-tile h-11 px-3.5 flex items-center gap-2.5">
                    <Search className="h-4 w-4 text-[var(--ms-ink-3)] shrink-0" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search tenant or room..."
                      className="w-full bg-transparent text-[13px] text-[var(--ms-ink)] placeholder:text-[var(--ms-placeholder)] focus:outline-none"
                    />
                  </div>
                  <FilterButton
                    activeCount={methodFilter !== "all" ? 1 : 0}
                    onClick={() => {
                      setDraftMethod(methodFilter);
                      setFilterOpen(true);
                    }}
                  />
                </div>

                <ActiveFilterPills
                  pills={
                    methodFilter !== "all"
                      ? [
                          {
                            id: "method",
                            label: methodFilter,
                            onRemove: () => setMethodFilter("all"),
                          },
                        ]
                      : []
                  }
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
                    {filteredTx.slice(0, 25).map((tx) => {
                      const dtRaw = tx.paidAt || tx.paymentDate || tx.createdAt;
                      const dtStr = dtRaw ? new Date(dtRaw).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
                      return (
                        <MobileCard
                          key={tx.id}
                          onClick={() => setSelectedTx(tx)}
                          className="p-3.5 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar name={tx.tenantName || "Resident"} size={40} />
                            <div className="min-w-0">
                              <div className="text-[14px] font-semibold text-[var(--ms-ink)] truncate">
                                {tx.tenantName || "Resident"}
                              </div>
                              <div className="text-[12px] text-[var(--ms-ink-3)] mt-0.5 truncate">
                                {tx.roomNumber ? `Room ${tx.roomNumber} · ` : ""}{dtStr}
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <MoneyText amount={tx.amountPaid} className="text-[15px] font-semibold text-[var(--ms-success)]" />
                            <div className="flex items-center justify-end gap-1 mt-1">
                              <StatusChip label={tx.paymentMethod || "Paid"} tone="info" />
                              <StatusChip label={tx.status || "Paid"} tone="success" />
                            </div>
                          </div>
                        </MobileCard>
                      );
                    })}
                  </div>
                )}
              </section>
            )}
          </SwipeTabs>
        </div>
      </PageScaffold>

      {/* R6: Filter Transactions BottomSheet */}
      <BottomSheet open={filterOpen} onClose={() => setFilterOpen(false)} title="Filter Transactions">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="text-[12px] font-semibold text-[var(--ms-ink-2)]">Payment Mode</div>
            <FilterChips
              items={[
                { id: "all", label: "All" },
                { id: "Cash", label: "Cash" },
                { id: "UPI", label: "UPI" },
                { id: "Bank Transfer", label: "Bank Transfer" },
              ]}
              value={draftMethod}
              onChange={setDraftMethod}
            />
          </div>
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <OutlineButton
              onClick={() => {
                setDraftMethod("all");
                setMethodFilter("all");
                setFilterOpen(false);
              }}
            >
              Reset
            </OutlineButton>
            <PrimaryButton
              onClick={() => {
                setMethodFilter(draftMethod);
                setFilterOpen(false);
              }}
            >
              Apply
            </PrimaryButton>
          </div>
        </div>
      </BottomSheet>

      {/* Transaction Detail Sheet (Preserves all ledger columns on mobile) */}
      <BottomSheet open={Boolean(selectedTx)} onClose={() => setSelectedTx(null)} title="Transaction Details">
        {selectedTx && (
          <div className="space-y-3 text-[13px]">
            <div className="flex items-center justify-between">
              <span className="text-[var(--ms-ink-3)]">Tenant</span>
              <span className="font-semibold text-[var(--ms-ink)]">{selectedTx.tenantName || "Resident"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--ms-ink-3)]">Room</span>
              <span className="font-medium">{selectedTx.roomNumber || "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--ms-ink-3)]">Amount</span>
              <MoneyText amount={selectedTx.amountPaid} className="font-semibold text-[var(--ms-success)]" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--ms-ink-3)]">Mode</span>
              <span className="font-medium">{selectedTx.paymentMethod || "—"}</span>
            </div>
            {selectedTx.utrNumber && (
              <div className="flex items-center justify-between">
                <span className="text-[var(--ms-ink-3)]">UTR / Ref</span>
                <span className="font-mono text-[12px]">{selectedTx.utrNumber}</span>
              </div>
            )}
            {selectedTx.notes && (
              <div className="pt-2 border-t border-[var(--ms-divider)]">
                <div className="text-[11px] text-[var(--ms-ink-3)]">Notes</div>
                <div className="mt-0.5 text-[var(--ms-ink)]">{selectedTx.notes}</div>
              </div>
            )}
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
