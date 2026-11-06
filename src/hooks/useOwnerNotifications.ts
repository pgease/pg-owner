import { useCallback, useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import {
  useComplaints,
  useRentCollectionDashboard,
  useGuestRequests,
  useNightOutRequests,
  usePropertyTenants,
} from "@/hooks/usePropertyOwnerQueries";

export type OwnerNotification = {
  id: string;
  title: string;
  body: string;
  to: string;
  read: boolean;
};

const READ_KEY = "pgease_notification_read_ids";

function loadReadIds(): Set<string> {
  try {
    const raw = window.localStorage.getItem(READ_KEY);
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function saveReadIds(ids: Set<string>) {
  try {
    window.localStorage.setItem(READ_KEY, JSON.stringify([...ids]));
  } catch {
    /* ignore */
  }
}

export function useOwnerNotifications() {
  const { selectedPgId } = useApp();
  const [readIds, setReadIds] = useState<Set<string>>(() => loadReadIds());
  const complaintsQuery = useComplaints(selectedPgId);
  const rentMonth = new Date().getMonth() + 1;
  const rentYear = new Date().getFullYear();
  const rentDashQuery = useRentCollectionDashboard(selectedPgId, rentMonth, rentYear);
  const guestQuery = useGuestRequests(selectedPgId, "pending");
  const nightOutQuery = useNightOutRequests(selectedPgId, "pending");
  const tenantsQuery = usePropertyTenants(selectedPgId);

  const items = useMemo<OwnerNotification[]>(() => {
    const list: OwnerNotification[] = [];

    // 1. Pending Guest Requests
    const rawGuests = Array.isArray((guestQuery.data as any)?.data)
      ? (guestQuery.data as any).data
      : Array.isArray(guestQuery.data)
      ? guestQuery.data
      : [];
    for (const g of rawGuests) {
      if (String(g.status || "").toLowerCase() === "pending") {
        list.push({
          id: `guest:${g.id}`,
          title: `Guest: ${g.guestName || "Visitor"} (${g.tenant?.name || "Tenant"})`,
          body: `Expected ${g.expectedArrival ? new Date(g.expectedArrival).toLocaleDateString("en-IN") : "soon"}`,
          to: "/tenants/guests",
          read: readIds.has(`guest:${g.id}`),
        });
      }
    }

    // 2. Pending Night Out Requests
    const rawNightOuts = Array.isArray((nightOutQuery.data as any)?.data)
      ? (nightOutQuery.data as any).data
      : Array.isArray(nightOutQuery.data)
      ? nightOutQuery.data
      : [];
    for (const n of rawNightOuts) {
      if (String(n.status || "").toLowerCase() === "pending") {
        list.push({
          id: `nightout:${n.id}`,
          title: `Night Out: ${n.tenant?.name || "Tenant"}`,
          body: n.reason || "Night out request pending approval",
          to: "/tenants/night-out",
          read: readIds.has(`nightout:${n.id}`),
        });
      }
    }

    // 3. Tenants Under Notice
    const rawTenants = Array.isArray(tenantsQuery.data) ? tenantsQuery.data : [];
    for (const t of rawTenants) {
      if (t.notice?.isOnNotice) {
        list.push({
          id: `notice:${t.roomTenant?.id || t.id}`,
          title: `Notice: ${t.name} (Room ${t.room?.roomNumber || "-"})`,
          body: t.notice.vacateOn
            ? `Vacates ${new Date(t.notice.vacateOn).toLocaleDateString("en-IN")}`
            : "Under notice period",
          to: "/tenants/notice-period",
          read: readIds.has(`notice:${t.roomTenant?.id || t.id}`),
        });
      }
    }

    // 4. Open Complaints
    const openComplaints = (Array.isArray(complaintsQuery.data) ? complaintsQuery.data : []).filter((c) => {
      const status = String((c as { status?: string }).status || "").toLowerCase();
      return status !== "resolved" && status !== "closed";
    });
    for (const c of openComplaints) {
      list.push({
        id: `complaint:${c.id}`,
        title: c.subject || c.category || "Open complaint",
        body: "Complaint needs attention",
        to: "/complaints",
        read: readIds.has(`complaint:${c.id}`),
      });
    }

    // 5. Unpaid Rent Dues
    const unpaidCount = Array.isArray(rentDashQuery.data?.unpaidTenants) ? rentDashQuery.data.unpaidTenants.length : 0;
    if (unpaidCount > 0) {
      const id = `rent-dues:${selectedPgId || "pg"}:${rentMonth}:${rentYear}:${unpaidCount}`;
      list.push({
        id,
        title: `${unpaidCount} rent ${unpaidCount === 1 ? "due" : "dues"}`,
        body: "Open the rent register",
        to: "/rent-payments/dues",
        read: readIds.has(id),
      });
    }

    return list;
  }, [
    complaintsQuery.data,
    rentDashQuery.data,
    guestQuery.data,
    nightOutQuery.data,
    tenantsQuery.data,
    readIds,
    selectedPgId,
    rentMonth,
    rentYear,
  ]);

  const unreadCount = items.filter((item) => !item.read).length;

  const markAllRead = useCallback(() => {
    const next = new Set(readIds);
    items.forEach((item) => next.add(item.id));
    setReadIds(next);
    saveReadIds(next);
  }, [items, readIds]);

  const markRead = useCallback(
    (id: string) => {
      const next = new Set(readIds);
      next.add(id);
      setReadIds(next);
      saveReadIds(next);
    },
    [readIds],
  );

  return { items, unreadCount, markAllRead, markRead };
}
