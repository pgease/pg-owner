import { useMemo } from "react";
import {
  useAllRoomsAndCounts,
  useComplaints,
  useCreditBalance,
  useKycApplications,
  usePropertyTenants,
  useRentCollectionDashboard,
} from "@/hooks/usePropertyOwnerQueries";
import type { PropertyTenant } from "@/api/propertyOwner";

export interface DerivedPropertySummary {
  totalRooms: number;
  occupiedBeds: number;
  vacantBeds: number;
  totalBeds: number;
  occupancyPct: number;
  totalTenants: number;
  kycPendingTenants: number;
  onNoticeTenants: number;
  openComplaints: number;
  inProgressComplaints: number;
  totalOpenTickets: number;
  pendingKycApplications: number;
  remainingCredits: number | undefined;
  collectedThisMonth: number;
  pendingRentAmount: number;
  unpaidTenantsCount: number;
}

export function isTenantKycVerified(t: PropertyTenant): boolean {
  if (t.kycVerified || t.aadhaarVerified || t.isKycVerified) return true;
  const s = String(t.kycStatus ?? "").toLowerCase();
  return s === "verified" || s === "approved" || s === "completed";
}

export function isTenantOnNotice(t: PropertyTenant): boolean {
  return Boolean(t.isOnNotice || t.notice?.isOnNotice || t.noticeGivenAt || t.expectedMoveOutDate);
}

/**
 * Pure selector that guarantees single-source-of-truth invariants:
 * - occupiedBeds + vacantBeds === totalBeds
 * - totalTenants === tenants.length
 */
export function computePropertySummary(params: {
  rooms?: Array<{ totalBeds?: number; occupiedBeds?: number; availableBeds?: number }>;
  tenants?: PropertyTenant[];
  complaints?: Array<{ status?: string }>;
  kycApps?: Array<Record<string, unknown>>;
  propertyId: string | null;
  creditsRemaining?: number;
  collectedThisMonth?: number;
  pendingRentAmount?: number;
  unpaidTenantsCount?: number;
}): DerivedPropertySummary {
  const rooms = params.rooms ?? [];
  const tenants = params.tenants ?? [];
  const complaints = params.complaints ?? [];
  const kycApps = params.kycApps ?? [];

  let occupiedBeds = 0;
  let vacantBeds = 0;
  for (const r of rooms) {
    const tot = Math.max(0, Number(r.totalBeds ?? 0));
    const occ = Math.max(0, Number(r.occupiedBeds ?? 0));
    const avail =
      r.availableBeds !== undefined && r.availableBeds !== null
        ? Math.max(0, Number(r.availableBeds))
        : Math.max(0, tot - occ);
    occupiedBeds += occ;
    vacantBeds += avail;
  }
  const totalBeds = occupiedBeds + vacantBeds;
  const occupancyPct = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  const totalTenants = tenants.length;
  const kycPendingTenants = tenants.filter((t) => !isTenantKycVerified(t)).length;
  const onNoticeTenants = tenants.filter(isTenantOnNotice).length;

  const norm = (s: unknown) => String(s ?? "").toLowerCase();
  const openComplaints = complaints.filter((c) => norm(c.status) === "open").length;
  const inProgressComplaints = complaints.filter((c) => norm(c.status) === "in_progress").length;

  const scopedKyc = params.propertyId
    ? kycApps.filter((r) => !r.propertyId || r.propertyId === params.propertyId)
    : kycApps;
  const pendingKycApplications = scopedKyc.filter((r) => {
    const s = String(r.status ?? "pending").toLowerCase();
    return !["completed", "approved", "verified", "rejected"].includes(s) && !r.processing_done;
  }).length;

  return {
    totalRooms: rooms.length,
    occupiedBeds,
    vacantBeds,
    totalBeds,
    occupancyPct,
    totalTenants,
    kycPendingTenants,
    onNoticeTenants,
    openComplaints,
    inProgressComplaints,
    totalOpenTickets: openComplaints + inProgressComplaints,
    pendingKycApplications,
    remainingCredits: params.creditsRemaining,
    collectedThisMonth: Number(params.collectedThisMonth ?? 0),
    pendingRentAmount: Number(params.pendingRentAmount ?? 0),
    unpaidTenantsCount: Number(params.unpaidTenantsCount ?? 0),
  };
}

/**
 * Single source of truth hook used across Dashboard, My PG, Tenants, Rent, and BottomNav badges.
 */
export function usePropertySummary(propertyId: string | null) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const roomsQuery = useAllRoomsAndCounts(propertyId);
  const tenantsQuery = usePropertyTenants(propertyId);
  const complaintsQuery = useComplaints(propertyId);
  const rentQuery = useRentCollectionDashboard(propertyId, month, year);
  const kycQuery = useKycApplications();
  const creditsQuery = useCreditBalance();

  const summary = useMemo(() => {
    const d = rentQuery.data;
    const unpaid = d?.unpaidTenants ?? [];
    const pendingRentAmount = unpaid.reduce((acc, row: any) => {
      const amt = Number(row.amountOutstanding ?? row.amountDue ?? row.pendingAmount ?? 0);
      return acc + (Number.isFinite(amt) && amt > 0 ? amt : 0);
    }, 0);

    return computePropertySummary({
      rooms: roomsQuery.data,
      tenants: (tenantsQuery.data as PropertyTenant[] | undefined) ?? [],
      complaints: complaintsQuery.data,
      kycApps: (kycQuery.data as Array<Record<string, unknown>> | undefined) ?? [],
      propertyId,
      creditsRemaining: creditsQuery.data ? Number(creditsQuery.data.remainingCredits ?? 0) : undefined,
      collectedThisMonth: Number(d?.totalCollectedThisPeriod ?? 0),
      pendingRentAmount,
      unpaidTenantsCount: d?.unpaidCount ?? unpaid.length,
    });
  }, [
    roomsQuery.data,
    tenantsQuery.data,
    complaintsQuery.data,
    rentQuery.data,
    kycQuery.data,
    creditsQuery.data,
    propertyId,
  ]);

  const refetchAll = async () => {
    await Promise.all([
      roomsQuery.refetch(),
      tenantsQuery.refetch(),
      complaintsQuery.refetch(),
      rentQuery.refetch(),
      kycQuery.refetch(),
      creditsQuery.refetch(),
    ]);
  };

  return {
    summary,
    tenants: (tenantsQuery.data as PropertyTenant[] | undefined) ?? [],
    rooms: roomsQuery.data ?? [],
    isLoading: roomsQuery.isLoading || tenantsQuery.isLoading,
    isFetching:
      roomsQuery.isFetching ||
      tenantsQuery.isFetching ||
      complaintsQuery.isFetching ||
      rentQuery.isFetching,
    tenantsError: tenantsQuery.isError,
    isError: roomsQuery.isError && tenantsQuery.isError,
    refetchAll,
    refetchTenants: tenantsQuery.refetch,
  };
}
