import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  IndianRupee,
  Megaphone,
  MessageSquareWarning,
  ShieldCheck,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { useOwnerNotifications } from "@/hooks/useOwnerNotifications";
import type { IconTone } from "@/mobile/tokens";
import {
  BottomSheet,
  FilterChips,
  IconTile,
  MobileCard,
  PrimaryButton,
  SectionHeader,
  StatusChip,
} from "@/mobile/components/ui/Primitives";
import { MascotEmptyState } from "@/mobile/components/ui/MascotStates";
import { cn } from "@/lib/utils";

function resolveNotificationMeta(item: { title: string; body: string; to?: string }): {
  category: "payments" | "complaints" | "kyc" | "tenants" | "system";
  tone: IconTone;
  icon: React.ReactNode;
} {
  const txt = `${item.title} ${item.body} ${item.to ?? ""}`.toLowerCase();
  if (txt.includes("rent") || txt.includes("payment") || txt.includes("due") || txt.includes("₹")) {
    return { category: "payments", tone: "green", icon: <IndianRupee className="h-5 w-5" /> };
  }
  if (txt.includes("complaint") || txt.includes("ticket") || txt.includes("issue")) {
    return { category: "complaints", tone: "red", icon: <MessageSquareWarning className="h-5 w-5" /> };
  }
  if (txt.includes("kyc") || txt.includes("aadhaar") || txt.includes("credit")) {
    return { category: "kyc", tone: "amber", icon: <ShieldCheck className="h-5 w-5" /> };
  }
  if (txt.includes("tenant") || txt.includes("notice") || txt.includes("move")) {
    return { category: "tenants", tone: "teal", icon: <Users className="h-5 w-5" /> };
  }
  return { category: "system", tone: "violet", icon: <Megaphone className="h-5 w-5" /> };
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { items, unreadCount, markAllRead, markRead } = useOwnerNotifications();
  const [filter, setFilter] = useState<"all" | "unread" | "payments" | "complaints" | "kyc" | "tenants">("all");
  const [detailItem, setDetailItem] = useState<(typeof items)[number] | null>(null);

  const enriched = useMemo(
    () => items.map((item) => ({ ...item, meta: resolveNotificationMeta(item) })),
    [items],
  );

  const filtered = useMemo(() => {
    return enriched.filter((it) => {
      if (filter === "unread") return !it.read;
      if (filter === "all") return true;
      return it.meta.category === filter;
    });
  }, [enriched, filter]);

  const handleTap = (item: (typeof enriched)[number]) => {
    markRead(item.id);
    if (item.to) {
      navigate(item.to);
    } else {
      setDetailItem(item);
    }
  };

  return (
    <div className="ms-shell max-w-xl mx-auto px-4 pt-3 pb-10 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => navigate("/notifications/preferences")}
          className="inline-flex items-center gap-1.5 px-3 h-10 rounded-xl border border-[var(--ms-border)] bg-[var(--ms-card)] text-[12px] font-semibold text-[var(--ms-ink)] cursor-pointer"
        >
          <SlidersHorizontal className="h-3.5 w-3.5 text-[var(--ms-brand-text)]" />
          <span>Preferences</span>
        </button>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="inline-flex items-center gap-1.5 px-3 h-10 rounded-xl bg-[var(--ms-brand-50)] text-[var(--ms-brand-text)] text-[12px] font-semibold cursor-pointer"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            <span>Mark all read ({unreadCount})</span>
          </button>
        )}
      </div>

      <FilterChips
        items={[
          { id: "all", label: "All", count: enriched.length },
          { id: "unread", label: "Unread", count: unreadCount },
          { id: "payments", label: "Payments" },
          { id: "complaints", label: "Complaints" },
          { id: "kyc", label: "KYC" },
          { id: "tenants", label: "Tenants" },
        ]}
        value={filter}
        onChange={(v) => setFilter(v as typeof filter)}
      />

      {filtered.length === 0 ? (
        <MobileCard>
          <MascotEmptyState
            variant="empty"
            size="md"
            title="You are all caught up"
            message="No alerts right now. Rent dues, KYC updates, and complaints will appear here."
          />
        </MobileCard>
      ) : (
        <section className="space-y-2.5">
          <SectionHeader title="Recent Alerts" />
          <div className="space-y-2.5">
            {filtered.map((item) => (
              <MobileCard
                key={item.id}
                onClick={() => handleTap(item)}
                className={cn(
                  "p-3.5 flex items-start gap-3",
                  !item.read && "border-l-4 border-l-[var(--ms-brand-600)] bg-[var(--ms-brand-50)]/30",
                )}
              >
                <IconTile icon={item.meta.icon} tone={item.meta.tone} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[14px] font-semibold text-[var(--ms-ink)] leading-snug">{item.title}</p>
                    {!item.read && <span className="h-2 w-2 rounded-full bg-[var(--ms-brand-600)] shrink-0 mt-1.5" />}
                  </div>
                  <p className="text-[12px] text-[var(--ms-ink-2)] mt-0.5 line-clamp-2">{item.body}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <StatusChip label={item.meta.category} tone="info" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        markRead(item.id);
                        setDetailItem(item);
                      }}
                      className="text-[11px] font-semibold text-[var(--ms-brand-text)] cursor-pointer"
                    >
                      Details
                    </button>
                  </div>
                </div>
              </MobileCard>
            ))}
          </div>
        </section>
      )}

      <BottomSheet open={Boolean(detailItem)} onClose={() => setDetailItem(null)} title="Notification Details">
        {detailItem && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <IconTile
                icon={resolveNotificationMeta(detailItem).icon}
                tone={resolveNotificationMeta(detailItem).tone}
                size="lg"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-[16px] font-semibold text-[var(--ms-ink)]">{detailItem.title}</h4>
                <p className="text-[13px] text-[var(--ms-ink-2)] mt-1 leading-relaxed">{detailItem.body}</p>
              </div>
            </div>
            {detailItem.to && (
              <PrimaryButton
                type="button"
                className="w-full"
                onClick={() => {
                  const target = detailItem.to;
                  setDetailItem(null);
                  navigate(target);
                }}
              >
                Open Record
              </PrimaryButton>
            )}
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
