import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Clock, Download, LayoutList, MoreHorizontal, MoreVertical, Plus, Search, Users } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { isTenantKycVerified, isTenantOnNotice, usePropertySummary } from "@/mobile/hooks/usePropertySummary";
import { useNetworkStatus } from "@/mobile/hooks/useNetworkStatus";
import { formatCount, formatINR } from "@/mobile/utils/formatters";
import { MobileAppHeader } from "@/mobile/components/ui/MobileHeaders";
import { PageScaffold } from "@/mobile/components/ui/PageScaffold";
import {
  Avatar,
  BottomSheet,
  ExtendedFAB,
  FilterChips,
  ListRow,
  MobileCard,
  SegmentedTabs,
  SkeletonBlock,
  StatusChip,
} from "@/mobile/components/ui/Primitives";
import { MascotEmptyState, MascotErrorState } from "@/mobile/components/ui/MascotStates";
import { toast } from "@/components/ui/use-toast";

export function MobileTenantsV2({ onExport }: { onExport?: () => void }) {
  const navigate = useNavigate();
  const { selectedPgId } = useApp();
  const { summary, tenants, isLoading, tenantsError, refetchAll, refetchTenants } = usePropertySummary(selectedPgId);
  const { isOffline, lastUpdated } = useNetworkStatus();

  const [tab, setTab] = useState<"residents" | "notice">("residents");
  const [search, setSearch] = useState("");
  const [kycFilter, setKycFilter] = useState<"all" | "pending" | "verified">("all");
  const [compact, setCompact] = useState(false);
  const [actionTenant, setActionTenant] = useState<any | null>(null);
  const [overflowOpen, setOverflowOpen] = useState(false);

  const hasActiveFilter = search.trim().length > 0 || kycFilter !== "all";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tenants.filter((t: any) => {
      if (tab === "notice" && !isTenantOnNotice(t)) return false;
      if (kycFilter === "pending" && isTenantKycVerified(t)) return false;
      if (kycFilter === "verified" && !isTenantKycVerified(t)) return false;
      if (!q) return true;
      const name = String(t.name ?? "").toLowerCase();
      const phone = String(t.phone ?? t.mobileContactNumber ?? "").toLowerCase();
      const room = String(t.roomNumber ?? t.room?.roomNumber ?? "").toLowerCase();
      return name.includes(q) || phone.includes(q) || room.includes(q);
    });
  }, [tenants, tab, kycFilter, search]);

  const handleAddTenant = () => {
    if (isOffline) {
      toast({ title: "You're offline", description: "Connect to the internet to add a tenant." });
      return;
    }
    navigate("/tenants/add");
  };

  const clearFilters = () => {
    setSearch("");
    setKycFilter("all");
  };

  return (
    <PageScaffold
      isOffline={isOffline}
      lastUpdated={lastUpdated}
      onRefresh={refetchAll}
      header={
        <MobileAppHeader
          showPgSwitcher={true}
          title="Tenant's Info"
          subtitle={`${formatCount(summary.totalTenants)} tenants registered`}
          rightActions={
            <button
              type="button"
              onClick={() => setOverflowOpen(true)}
              className="h-10 w-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white cursor-pointer"
              aria-label="More tenant options"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
          }
        />
      }
    >
      <div className="px-4 pt-4 space-y-3.5">
        {/* Search + Normal/Compact Segmented Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex-1 ms-tile h-12 px-3.5 flex items-center gap-2.5">
            <Search className="h-4 w-4 text-[var(--ms-ink-3)] shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or room..."
              className="w-full bg-transparent text-[13px] text-[var(--ms-ink)] placeholder:text-[var(--ms-placeholder)] focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => setCompact((v) => !v)}
            className="ms-tile h-12 px-3 flex items-center gap-1.5 text-[12px] font-medium text-[var(--ms-ink-2)] shrink-0 cursor-pointer"
            aria-label="Toggle compact view"
          >
            <LayoutList className="h-4 w-4 text-[var(--ms-brand-text)]" />
            <span>{compact ? "Compact" : "Normal"}</span>
          </button>
        </div>

        {/* Summary Strip */}
        <div className="text-[12px] text-[var(--ms-ink-3)] flex flex-wrap items-center gap-x-2 gap-y-1 px-1">
          <span>{formatCount(summary.totalTenants)} residents</span>
          <span>·</span>
          <span>{formatCount(summary.totalTenants - summary.kycPendingTenants)} KYC verified</span>
          <span>·</span>
          <span>{formatCount(summary.onNoticeTenants)} on notice</span>
        </div>

        {/* Segmented Tabs */}
        <SegmentedTabs
          tabs={[
            { id: "residents", label: "Residents", badge: summary.totalTenants },
            { id: "notice", label: "Notice Period", badge: summary.onNoticeTenants },
          ]}
          value={tab}
          onChange={setTab}
        />

        {/* Filter Chips */}
        <FilterChips
          items={[
            { id: "all", label: "All KYC" },
            { id: "pending", label: "KYC Pending", count: summary.kycPendingTenants },
            { id: "verified", label: "Verified" },
          ]}
          value={kycFilter}
          onChange={setKycFilter}
        />

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3">
            <SkeletonBlock className="h-20 w-full" />
            <SkeletonBlock className="h-20 w-full" />
            <SkeletonBlock className="h-20 w-full" />
          </div>
        ) : tenantsError ? (
          <MobileCard>
            <MascotErrorState
              title="Couldn't load tenants"
              message="We couldn't fetch your tenant list right now. Please try again."
              onRetry={() => void refetchTenants()}
            />
          </MobileCard>
        ) : filtered.length === 0 ? (
          <MobileCard>
            {tab === "notice" && !hasActiveFilter ? (
              <MascotEmptyState
                variant="empty"
                size="md"
                title="No tenants on notice"
                message="Tenants who give notice will appear here."
              />
            ) : hasActiveFilter ? (
              <MascotEmptyState
                variant="empty"
                size="md"
                title="No matching tenants"
                message="Try adjusting your search or filter chips."
                actionLabel="Clear filters"
                onAction={clearFilters}
              />
            ) : (
              <MascotEmptyState
                variant="empty"
                size="md"
                title="No tenants yet"
                message="Tap the button below to add your first tenant"
                actionLabel="+ Add Tenant"
                onAction={handleAddTenant}
              />
            )}
          </MobileCard>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((t: any) => {
              const verified = isTenantKycVerified(t);
              const onNotice = isTenantOnNotice(t);
              const roomNum = t.roomNumber ?? t.room?.roomNumber ?? "—";
              const bedNum = t.bedNumber ?? t.bed?.bedNumber;
              const rentAmt = t.monthlyRent ?? t.rentAmount ?? t.rent ?? 0;

              return (
                <MobileCard
                  key={t.id}
                  onClick={() => navigate(`/tenants/${t.id}`)}
                  className={compact ? "p-3" : "p-3.5"}
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={t.name || "Tenant"} src={t.photoUrl} size={compact ? 38 : 44} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[14px] font-semibold text-[var(--ms-ink)] truncate">
                          {t.name || "Resident"}
                        </span>
                        <span className="text-[14px] font-semibold text-[var(--ms-brand-text)] tabular-nums whitespace-nowrap shrink-0">
                          {formatINR(rentAmt)}
                        </span>
                      </div>
                      <div className="text-[12px] text-[var(--ms-ink-3)] mt-0.5 truncate">
                        Room {roomNum}
                        {bedNum ? ` · Bed ${bedNum}` : ""}
                      </div>
                      {!compact && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <StatusChip label="Occupied" tone="success" />
                          <StatusChip
                            label={verified ? "KYC Verified" : "KYC Pending"}
                            tone={verified ? "success" : "pending"}
                            icon={verified ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                          />
                          {onNotice && <StatusChip label="On Notice" tone="pending" />}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActionTenant(t);
                      }}
                      className="h-10 w-10 rounded-xl flex items-center justify-center text-[var(--ms-ink-3)] hover:bg-[var(--ms-page)] shrink-0 cursor-pointer"
                      aria-label="Tenant actions"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </MobileCard>
              );
            })}
          </div>
        )}
      </div>

      <ExtendedFAB
        icon={<Plus className="h-5 w-5" />}
        label="Add Tenant"
        onClick={handleAddTenant}
        className="bottom-[calc(76px+env(safe-area-inset-bottom,0px))]"
      />

      <BottomSheet open={overflowOpen} onClose={() => setOverflowOpen(false)} title="Tenant Options">
        <div className="divide-y divide-[var(--ms-divider)] rounded-2xl border border-[var(--ms-border)] overflow-hidden">
          {onExport && (
            <ListRow
              tone="green"
              icon={<Download className="h-5 w-5" />}
              title="Export Tenants CSV"
              subtitle="Download resident list"
              onClick={() => {
                setOverflowOpen(false);
                onExport();
              }}
            />
          )}
          <ListRow
            tone="blue"
            icon={<LayoutList className="h-5 w-5" />}
            title={compact ? "Switch to Normal View" : "Switch to Compact View"}
            onClick={() => {
              setCompact((v) => !v);
              setOverflowOpen(false);
            }}
          />
          <ListRow
            tone="amber"
            icon={<Clock className="h-5 w-5" />}
            title="Notice Period Management"
            subtitle="Extend, cancel or move out"
            onClick={() => {
              setOverflowOpen(false);
              navigate("/tenants/notice-period");
            }}
          />
        </div>
      </BottomSheet>

      <BottomSheet
        open={Boolean(actionTenant)}
        onClose={() => setActionTenant(null)}
        title={actionTenant?.name || "Tenant Actions"}
      >
        {actionTenant && (
          <div className="divide-y divide-[var(--ms-divider)] rounded-2xl border border-[var(--ms-border)] overflow-hidden">
            <ListRow
              tone="teal"
              icon={<Users className="h-5 w-5" />}
              title="Open Full Tenant Record"
              subtitle="Joining form, passbook, KYC & payments"
              onClick={() => {
                const id = actionTenant.id;
                setActionTenant(null);
                navigate(`/tenants/${id}`);
              }}
            />
            <ListRow
              tone="amber"
              icon={<Clock className="h-5 w-5" />}
              title="Notice Period Actions"
              subtitle="Extend, cancel notice or move out"
              onClick={() => {
                setActionTenant(null);
                navigate("/tenants/notice-period");
              }}
            />
          </div>
        )}
      </BottomSheet>
    </PageScaffold>
  );
}
