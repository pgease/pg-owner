import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRightLeft,
  Download,
  FileCheck,
  FileClock,
  Filter,
  MessageCircle,
  Phone,
  Plus,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  ChevronDown,
  LayoutList,
  Rows,
} from "lucide-react";
import type { PropertyTenant } from "@/api/propertyOwner";
import {
  tenantAgreementState,
  tenantDisplayName,
  tenantPhone,
  tenantRentAmount,
  tenantRoomNo,
  tenantBedNo,
  tenantStayStatus,
  tenantVerificationLabel,
} from "@/lib/tenantDisplay";
import { MobileCard, MobileChips, MobileEmpty, MobileSearch } from "@/components/mobile/MobileUi";
import { TenantAvatar } from "@/components/tenants/TenantAvatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function waHref(phone: string): string | null {
  const d = phone.replace(/\D/g, "");
  if (d.length < 10) return null;
  return `https://wa.me/${d.length === 10 ? `91${d}` : d}`;
}

export interface MobileTenantsSummary {
  total: number;
  due: number;
  kycVerified: number;
  onNotice: number;
  kycPending?: number;
}

export function MobileTenantsList({
  searchQuery,
  onSearch,
  statusFilter,
  onStatus,
  statusCounts,
  tenants,
  loading,
  paidThisMonth,
  onOpenTenant,
  onAddTenant,
  summary,
  onMoveTenant,
  onExportCSV,
  density = "default",
  onDensityChange,
  blocks = [],
  selectedBlockId = "",
  onSelectBlockId,
  floors = [],
  selectedFloorId = "",
  onSelectFloorId,
  rooms = [],
  selectedRoomId = "",
  onSelectRoomId,
  kycFilter = "all",
  onKycFilter,
}: {
  searchQuery: string;
  onSearch: (v: string) => void;
  statusFilter: "all" | "active" | "notice" | "moved_out";
  onStatus: (v: "all" | "active" | "notice" | "moved_out") => void;
  statusCounts: { all: number; active: number; notice: number; movedOut: number };
  tenants: PropertyTenant[];
  loading: boolean;
  paidThisMonth: Set<string>;
  onOpenTenant: (t: PropertyTenant) => void;
  onAddTenant: (e: React.MouseEvent) => void;
  summary?: MobileTenantsSummary;
  onMoveTenant?: () => void;
  onExportCSV?: () => void;
  density?: "default" | "compact";
  onDensityChange?: (d: "default" | "compact") => void;
  blocks?: Array<{ id: string; name: string }>;
  selectedBlockId?: string;
  onSelectBlockId?: (id: string) => void;
  floors?: Array<{ id: string; name?: string; floorNumber?: number }>;
  selectedFloorId?: string;
  onSelectFloorId?: (id: string) => void;
  rooms?: Array<{ id: string; roomNumber: string }>;
  selectedRoomId?: string;
  onSelectRoomId?: (id: string) => void;
  kycFilter?: "all" | "verified" | "pending";
  onKycFilter?: (k: "all" | "verified" | "pending") => void;
}) {
  const [showFilters, setShowFilters] = useState(false);

  const activeFiltersCount = [
    selectedBlockId && selectedBlockId !== "all",
    selectedFloorId && selectedFloorId !== "all",
    selectedRoomId && selectedRoomId !== "all",
    kycFilter && kycFilter !== "all",
  ].filter(Boolean).length;

  return (
    <div className="md:hidden space-y-3 pb-24">
      {/* Title, Subtitle & Quick Actions */}
      <div className="flex items-start justify-between gap-2 pt-1 px-1">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Tenants</h1>
          {summary ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
              {summary.total} residents · {summary.due} rent due · {summary.kycVerified} KYC verified · {summary.onNotice} on notice
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {onMoveTenant && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onMoveTenant}
              className="h-8 px-2.5 text-xs font-semibold rounded-lg gap-1 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-2xs"
            >
              <ArrowRightLeft className="h-3.5 w-3.5 text-[#008080]" />
              Move
            </Button>
          )}
          {onExportCSV && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onExportCSV}
              className="h-8 px-2 text-xs font-semibold rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-2xs"
              title="Export CSV"
            >
              <Download className="h-3.5 w-3.5 text-slate-600" />
            </Button>
          )}
        </div>
      </div>

      {/* 4 Summary Blocks */}
      {summary ? (
        <div className="grid grid-cols-4 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="border-r border-slate-200 dark:border-slate-800 px-2.5 py-2 text-center">
            <p className="text-[10.5px] font-medium text-slate-500 dark:text-slate-400 truncate">Residents</p>
            <p className="text-base font-bold tabular-nums tracking-tight text-slate-900 dark:text-white mt-0.5">{summary.total}</p>
          </div>
          <div className="border-r border-slate-200 dark:border-slate-800 px-2.5 py-2 text-center">
            <p className="text-[10.5px] font-medium text-slate-500 dark:text-slate-400 truncate">Rent due</p>
            <p className={cn("text-base font-bold tabular-nums tracking-tight mt-0.5", summary.due > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-900 dark:text-white")}>
              {summary.due}
            </p>
          </div>
          <div className="border-r border-slate-200 dark:border-slate-800 px-2.5 py-2 text-center">
            <p className="text-[10.5px] font-medium text-slate-500 dark:text-slate-400 truncate">KYC done</p>
            <p className="text-base font-bold tabular-nums tracking-tight text-emerald-600 dark:text-emerald-400 mt-0.5">{summary.kycVerified}</p>
          </div>
          <div className="px-2.5 py-2 text-center">
            <p className="text-[10.5px] font-medium text-slate-500 dark:text-slate-400 truncate">On notice</p>
            <p className={cn("text-base font-bold tabular-nums tracking-tight mt-0.5", summary.onNotice > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white")}>
              {summary.onNotice}
            </p>
          </div>
        </div>
      ) : null}

      {/* Search and Filters Toggle */}
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <MobileSearch
            value={searchQuery}
            onChange={onSearch}
            placeholder="Search name, phone, room"
            aria-label="Search tenants"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className={cn(
            "relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-sm transition-colors",
            showFilters || activeFiltersCount > 0
              ? "border-[#008080] bg-[#E8FFFF] text-[#008080] dark:bg-teal-950/40 dark:text-teal-300"
              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
          )}
          aria-label="Toggle filters"
        >
          <SlidersHorizontal className="h-5 w-5" />
          {activeFiltersCount > 0 ? (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#008080] text-white text-[10px] font-bold flex items-center justify-center">
              {activeFiltersCount}
            </span>
          ) : null}
        </button>
        {onDensityChange && (
          <button
            type="button"
            onClick={() => onDensityChange(density === "compact" ? "default" : "compact")}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
            title={density === "compact" ? "Switch to detailed view" : "Switch to compact view"}
            aria-label={density === "compact" ? "Detailed view" : "Compact view"}
          >
            {density === "compact" ? <Rows className="h-5 w-5" /> : <LayoutList className="h-5 w-5" />}
          </button>
        )}
      </div>

      {/* Collapsible Filter Bar */}
      {showFilters && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 space-y-3 shadow-sm animate-fade-in">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Filter Tenants</span>
            {(selectedBlockId || selectedFloorId || selectedRoomId || kycFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  onSelectBlockId?.("");
                  onSelectFloorId?.("");
                  onSelectRoomId?.("");
                  onKycFilter?.("all");
                }}
                className="text-xs text-[#008080] font-semibold"
              >
                Reset filters
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {blocks.length > 0 && onSelectBlockId && (
              <div>
                <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Block</label>
                <select
                  value={selectedBlockId}
                  onChange={(e) => onSelectBlockId(e.target.value)}
                  className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 text-slate-800 dark:text-slate-200 text-xs"
                >
                  <option value="">All Blocks</option>
                  {blocks.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}
            {floors.length > 0 && onSelectFloorId && (
              <div>
                <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Floor</label>
                <select
                  value={selectedFloorId}
                  onChange={(e) => onSelectFloorId(e.target.value)}
                  className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 text-slate-800 dark:text-slate-200 text-xs"
                >
                  <option value="">All Floors</option>
                  {floors.map((f) => (
                    <option key={f.id} value={f.id}>{f.name || `Floor ${f.floorNumber}`}</option>
                  ))}
                </select>
              </div>
            )}
            {rooms.length > 0 && onSelectRoomId && (
              <div>
                <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Room</label>
                <select
                  value={selectedRoomId}
                  onChange={(e) => onSelectRoomId(e.target.value)}
                  className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 text-slate-800 dark:text-slate-200 text-xs"
                >
                  <option value="">All Rooms</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>Room {r.roomNumber}</option>
                  ))}
                </select>
              </div>
            )}
            {onKycFilter && (
              <div>
                <label className="text-[11px] font-semibold text-slate-500 mb-1 block">KYC Status</label>
                <select
                  value={kycFilter}
                  onChange={(e) => onKycFilter(e.target.value as any)}
                  className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 text-slate-800 dark:text-slate-200 text-xs"
                >
                  <option value="all">All KYC</option>
                  <option value="verified">Verified Only</option>
                  <option value="pending">Pending Only</option>
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Status Chips */}
      <MobileChips
        value={statusFilter}
        onChange={(id) => onStatus(id as typeof statusFilter)}
        items={[
          { id: "all", label: `All · ${statusCounts.all}` },
          { id: "active", label: `Active · ${statusCounts.active}` },
          { id: "notice", label: `Notice · ${statusCounts.notice}` },
          { id: "moved_out", label: `Moved out · ${statusCounts.movedOut}` },
        ]}
      />

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-[16px] bg-white dark:bg-slate-800" />
          ))}
        </div>
      ) : tenants.length === 0 ? (
        <MobileEmpty
          title="No tenants found"
          description="Try adjusting your search or filters, or add a new tenant."
          action={
            <Link
              to="/tenants/add"
              onClick={onAddTenant}
              className="inline-flex h-11 items-center rounded-full bg-[#008080] px-5 text-[14px] font-medium text-white shadow-sm"
            >
              Add tenant
            </Link>
          }
        />
      ) : density === "compact" ? (
        /* Compact List View */
        <div className="space-y-1.5">
          {tenants.map((t, idx) => {
            const phone = tenantPhone(t);
            const ids = [t.id, t.roomTenantId, t.roomTenant?.id].filter(Boolean).map(String);
            const isPaid = ids.some((id) => paidThisMonth.has(id));
            return (
              <div
                key={t.id || `t-c-${idx}`}
                onClick={() => onOpenTenant(t)}
                className="flex items-center justify-between gap-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 shadow-2xs cursor-pointer hover:border-[#008080] transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <TenantAvatar tenant={t} className="h-9 w-9 shrink-0 text-xs" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white leading-tight">
                      {tenantDisplayName(t)}
                    </p>
                    <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      Room {tenantRoomNo(t)}{tenantBedNo(t) !== "—" ? ` · Bed ${tenantBedNo(t)}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      isPaid
                        ? "bg-[#D2FDC0] text-[#187D3F] dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "bg-[#FFE7CC] text-[#FF8800] dark:bg-amber-950/60 dark:text-amber-300"
                    )}
                  >
                    {isPaid ? "Paid" : "Due"}
                  </span>
                  {phone !== "—" && (
                    <a
                      href={`tel:${phone.replace(/\D/g, "")}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    >
                      <Phone className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Normal Detailed Card View */
        <div className="space-y-2.5">
          {tenants.map((t, idx) => {
            const phone = tenantPhone(t);
            const wa = phone !== "—" ? waHref(phone) : null;
            const stay = tenantStayStatus(t);
            const ids = [t.id, t.roomTenantId, t.roomTenant?.id].filter(Boolean).map(String);
            const isPaid = ids.some((id) => paidThisMonth.has(id));
            const kycDone = tenantVerificationLabel(t) === "verified";
            const agreement = tenantAgreementState(t);
            return (
              <MobileCard key={t.id || `t-${idx}`} onClick={() => onOpenTenant(t)}>
                <div className="flex items-start gap-3">
                  <TenantAvatar tenant={t} className="h-12 w-12 shrink-0 text-[13px]" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-[16px] font-semibold text-[#101010] dark:text-white">{tenantDisplayName(t)}</p>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                          isPaid
                            ? "bg-[#D2FDC0] text-[#187D3F] dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "bg-[#FFE7CC] text-[#FF8800] dark:bg-amber-950/60 dark:text-amber-300",
                        )}
                      >
                        {isPaid ? "Paid" : "Due"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[13px] text-[#636363] dark:text-slate-400">
                      Room {tenantRoomNo(t)}
                      {tenantBedNo(t) !== "—" ? ` · Bed ${tenantBedNo(t)}` : ""}
                    </p>
                    <p className="mt-0.5 text-[13px] font-medium tabular-nums text-[#101010] dark:text-white">{tenantRentAmount(t)}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-medium",
                          stay === "UNDER_NOTICE"
                            ? "bg-[#FFE7CC] text-[#FF8800] dark:bg-amber-950/60 dark:text-amber-300"
                            : stay === "MOVED_OUT"
                              ? "bg-[#F5F5F5] text-[#636363] dark:bg-slate-800 dark:text-slate-400"
                              : "bg-[#E8FFFF] text-[#008080] dark:bg-teal-950/60 dark:text-teal-300",
                        )}
                      >
                        {stay === "UNDER_NOTICE" ? "Notice" : stay === "MOVED_OUT" ? "Moved out" : "Active"}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#F5F5F5] dark:bg-slate-800 px-2 py-0.5 text-[11px] text-[#636363] dark:text-slate-300" title={kycDone ? "KYC verified" : "KYC pending"}>
                        {kycDone ? <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> : <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />}
                        {kycDone ? "KYC done" : "KYC pending"}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#F5F5F5] dark:bg-slate-800 px-2 py-0.5 text-[11px] text-[#636363] dark:text-slate-300" title={agreement === "signed" ? "Agreement signed" : "Agreement pending"}>
                        {agreement === "signed" ? <FileCheck className="h-3.5 w-3.5 text-emerald-600" /> : <FileClock className="h-3.5 w-3.5 text-amber-600" />}
                        {agreement === "signed" ? "Agreement signed" : "Agreement pending"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                  {phone !== "—" ? (
                    <a
                      href={`tel:${phone.replace(/\D/g, "")}`}
                      className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#F5F5F5] dark:bg-slate-800 text-[13px] font-medium text-[#101010] dark:text-white"
                    >
                      <Phone className="h-4 w-4" /> Call
                    </a>
                  ) : null}
                  {wa ? (
                    <a
                      href={wa}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#E8FFFF] dark:bg-teal-950/60 text-[13px] font-medium text-[#008080] dark:text-teal-300"
                    >
                      <MessageCircle className="h-4 w-4" /> WhatsApp
                    </a>
                  ) : null}
                </div>
              </MobileCard>
            );
          })}
        </div>
      )}

      {/* Floating Add Tenant Action */}
      <Link
        to="/tenants/add"
        onClick={onAddTenant}
        className="fixed z-30 flex h-14 items-center gap-2 rounded-full bg-[#008080] px-5 text-[15px] font-medium text-white shadow-[0_8px_24px_rgba(0,128,128,0.35)] active:scale-95 transition-all"
        style={{ bottom: "calc(72px + var(--safe-bottom) + 12px)", right: "16px" }}
      >
        <Plus className="h-4 w-4" />
        Add tenant
      </Link>
    </div>
  );
}
