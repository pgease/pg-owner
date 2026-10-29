import { Link } from "react-router-dom";
import { MessageCircle, Phone, Plus } from "lucide-react";
import type { PropertyTenant } from "@/api/propertyOwner";
import {
  tenantDisplayName,
  tenantInitials,
  tenantPhone,
  tenantPhotoUrl,
  tenantRentAmount,
  tenantRoomNo,
  tenantBedNo,
  tenantStayStatus,
  tenantVerificationLabel,
} from "@/lib/tenantDisplay";
import { MobileCard, MobileChips, MobileEmpty, MobileSearch } from "@/components/mobile/MobileUi";
import { cn } from "@/lib/utils";

function waHref(phone: string): string | null {
  const d = phone.replace(/\D/g, "");
  if (d.length < 10) return null;
  return `https://wa.me/${d.length === 10 ? `91${d}` : d}`;
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
}) {
  return (
    <div className="md:hidden space-y-3 pb-24">
      <MobileSearch
        value={searchQuery}
        onChange={onSearch}
        placeholder="Search name, phone, room"
        aria-label="Search tenants"
      />
      <MobileChips
        value={statusFilter}
        onChange={(id) => onStatus(id as typeof statusFilter)}
        items={[
          { id: "all", label: `All ${statusCounts.all}` },
          { id: "active", label: `Active ${statusCounts.active}` },
          { id: "notice", label: `Notice ${statusCounts.notice}` },
          { id: "moved_out", label: `Moved out ${statusCounts.movedOut}` },
        ]}
      />

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-[16px] bg-white" />
          ))}
        </div>
      ) : tenants.length === 0 ? (
        <MobileEmpty
          title="No tenants yet"
          description="Add a resident to assign a room and start tracking rent."
          action={
            <Link
              to="/tenants/add"
              onClick={onAddTenant}
              className="inline-flex h-11 items-center rounded-full bg-[#008080] px-4 text-[14px] font-medium text-white"
            >
              Add tenant
            </Link>
          }
        />
      ) : (
        <div className="space-y-2.5">
          {tenants.map((t, idx) => {
            const photo = tenantPhotoUrl(t);
            const phone = tenantPhone(t);
            const wa = phone !== "—" ? waHref(phone) : null;
            const stay = tenantStayStatus(t);
            const ids = [t.id, t.roomTenantId, t.roomTenant?.id].filter(Boolean).map(String);
            const isPaid = ids.some((id) => paidThisMonth.has(id));
            const kyc = tenantVerificationLabel(t);
            return (
              <MobileCard key={t.id || `t-${idx}`} onClick={() => onOpenTenant(t)}>
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E8FFFF] text-[13px] font-semibold text-[#008080]">
                    {photo ? <img src={photo} alt="" className="h-full w-full object-cover" /> : tenantInitials(t)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-[16px] font-semibold text-[#101010]">{tenantDisplayName(t)}</p>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                          isPaid ? "bg-[#D2FDC0] text-[#187D3F]" : "bg-[#FFE7CC] text-[#FF8800]",
                        )}
                      >
                        {isPaid ? "Paid" : "Due"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[13px] text-[#636363]">
                      Room {tenantRoomNo(t)}
                      {tenantBedNo(t) !== "—" ? ` · Bed ${tenantBedNo(t)}` : ""}
                    </p>
                    <p className="mt-0.5 text-[13px] font-medium tabular-nums text-[#101010]">{tenantRentAmount(t)}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-medium",
                          stay === "UNDER_NOTICE"
                            ? "bg-[#FFE7CC] text-[#FF8800]"
                            : stay === "MOVED_OUT"
                              ? "bg-[#F5F5F5] text-[#636363]"
                              : "bg-[#E8FFFF] text-[#008080]",
                        )}
                      >
                        {stay === "UNDER_NOTICE" ? "Notice" : stay === "MOVED_OUT" ? "Moved out" : "Active"}
                      </span>
                      <span className="rounded-full bg-[#F5F5F5] px-2 py-0.5 text-[11px] text-[#636363]">
                        KYC {kyc === "verified" ? "verified" : "pending"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                  {phone !== "—" ? (
                    <a
                      href={`tel:${phone.replace(/\D/g, "")}`}
                      className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#F5F5F5] text-[13px] font-medium text-[#101010]"
                    >
                      <Phone className="h-4 w-4" /> Call
                    </a>
                  ) : null}
                  {wa ? (
                    <a
                      href={wa}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#E8FFFF] text-[13px] font-medium text-[#008080]"
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

      <Link
        to="/tenants/add"
        onClick={onAddTenant}
        className="fixed z-30 flex h-14 items-center gap-2 rounded-full bg-[#008080] px-5 text-[15px] font-medium text-white shadow-[0_8px_24px_rgba(0,128,128,0.35)]"
        style={{ bottom: "calc(72px + var(--safe-bottom) + 12px)", right: "16px" }}
      >
        <Plus className="h-4 w-4" />
        Add tenant
      </Link>
    </div>
  );
}
