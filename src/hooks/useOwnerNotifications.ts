import { useCallback, useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import { useComplaints, useRentCollectionDashboard } from "@/hooks/usePropertyOwnerQueries";

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

  const items = useMemo<OwnerNotification[]>(() => {
    const openComplaints = (Array.isArray(complaintsQuery.data) ? complaintsQuery.data : []).filter((c) => {
      const status = String((c as { status?: string }).status || "").toLowerCase();
      return status !== "resolved" && status !== "closed";
    });
    const unpaidCount = Array.isArray(rentDashQuery.data?.unpaidTenants) ? rentDashQuery.data.unpaidTenants.length : 0;

    const list: OwnerNotification[] = openComplaints.map((c) => ({
      id: `complaint:${c.id}`,
      title: c.subject || c.category || "Open complaint",
      body: "Complaint needs attention",
      to: "/complaints",
      read: readIds.has(`complaint:${c.id}`),
    }));

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
  }, [complaintsQuery.data, rentDashQuery.data, readIds, selectedPgId, rentMonth, rentYear]);

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
