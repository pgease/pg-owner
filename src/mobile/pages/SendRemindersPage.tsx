import React, { useMemo, useState } from "react";
import { Check, CheckCircle2, MessageSquare, Send } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useRentCollectionDashboard } from "@/hooks/usePropertyOwnerQueries";
import { sendWhatsAppRentReminder } from "@/api/propertyOwner";
import { formatINR } from "@/mobile/utils/formatters";
import {
  ConfirmDialog,
  FilterChips,
  MobileCard,
  PrimaryButton,
  StatusChip,
} from "@/mobile/components/ui/Primitives";
import { MascotEmptyState } from "@/mobile/components/ui/MascotStates";
import { toast } from "@/components/ui/use-toast";

export default function SendRemindersPage() {
  const { selectedPgId, properties } = useApp();
  const list = Array.isArray(properties) ? properties : [];
  const selectedPg = list.find((p) => p.id === selectedPgId);

  const now = new Date();
  const rentQuery = useRentCollectionDashboard(selectedPgId, now.getMonth() + 1, now.getFullYear());
  const unpaidRaw = rentQuery.data?.unpaidTenants ?? [];

  const [filter, setFilter] = useState<"all" | "overdue" | "pending" | "partial">("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [channel, setChannel] = useState<"whatsapp" | "sms">("whatsapp");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<{ sent: number; failed: number } | null>(null);

  const duesList = useMemo(() => {
    return unpaidRaw
      .map((r: any, idx: number) => {
        const id = String(r.roomTenantId || r.room_tenant_id || r.tenantId || idx);
        const amount = Number(r.amountOutstanding ?? r.amountDue ?? r.pendingAmount ?? 0);
        const paid = Number(r.amountPaid ?? 0);
        const status = paid > 0 ? "partial" : Number(r.daysOverdue ?? 0) > 0 || String(r.status).toLowerCase() === "overdue" ? "overdue" : "pending";
        return {
          id,
          roomTenantId: String(r.roomTenantId || r.room_tenant_id || ""),
          name: String(r.tenantName || r.name || "Resident"),
          room: String(r.roomNumber || r.room_number || "—"),
          amount,
          daysOverdue: Number(r.daysOverdue ?? 0),
          status,
        };
      })
      .filter((d) => d.amount > 0);
  }, [unpaidRaw]);

  const filtered = useMemo(() => {
    if (filter === "all") return duesList;
    return duesList.filter((d) => d.status === filter);
  }, [duesList, filter]);

  const toggle = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleAll = () => {
    if (selectedIds.length === filtered.length) setSelectedIds([]);
    else setSelectedIds(filtered.map((d) => d.id));
  };

  const handleSend = async () => {
    if (!selectedIds.length) return;
    setSending(true);
    let sent = 0;
    let failed = 0;
    for (const id of selectedIds) {
      const item = duesList.find((d) => d.id === id);
      if (!item?.roomTenantId) {
        failed++;
        continue;
      }
      try {
        await sendWhatsAppRentReminder(item.roomTenantId, {
          channel,
        } as any);
        sent++;
      } catch {
        failed++;
      }
    }
    setSending(false);
    setResults({ sent, failed });
    toast({
      title: `Reminders sent: ${sent}`,
      description: failed > 0 ? `${failed} failed — you can retry.` : "All selected residents notified.",
    });
  };

  const sample = duesList.find((d) => selectedIds.includes(d.id)) ?? duesList[0];

  return (
    <div className="ms-shell px-4 pt-3 pb-28 space-y-4">
      <FilterChips
        items={[
          { id: "all", label: "All", count: duesList.length },
          { id: "overdue", label: "Overdue", count: duesList.filter((d) => d.status === "overdue").length },
          { id: "pending", label: "Pending", count: duesList.filter((d) => d.status === "pending").length },
          { id: "partial", label: "Partial", count: duesList.filter((d) => d.status === "partial").length },
        ]}
        value={filter}
        onChange={(v) => setFilter(v as typeof filter)}
      />

      {/* Channel selector */}
      <MobileCard className="p-3.5 space-y-2.5">
        <div className="text-[12px] font-semibold text-[var(--ms-ink-2)]">Delivery Channel</div>
        <div className="grid grid-cols-2 gap-2">
          {(["whatsapp", "sms"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setChannel(c)}
              className={
                channel === c
                  ? "h-10 rounded-xl bg-[var(--ms-brand-600)] text-white text-[13px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  : "h-10 rounded-xl bg-[var(--ms-page)] border border-[var(--ms-border)] text-[var(--ms-ink-2)] text-[13px] font-medium flex items-center justify-center gap-1.5 cursor-pointer"
              }
            >
              <MessageSquare className="h-4 w-4" />
              <span>{c === "whatsapp" ? "WhatsApp" : "SMS"}</span>
            </button>
          ))}
        </div>
        {sample && (
          <div className="rounded-xl bg-[var(--ms-page)] p-3 text-[12px] text-[var(--ms-ink-2)] leading-relaxed">
            <div className="font-semibold text-[var(--ms-ink)] mb-0.5">Message Preview</div>
            Hi {sample.name}, your rent of {formatINR(sample.amount)} for {selectedPg?.name || "your PG"} (Room {sample.room}) is pending. Please pay at your earliest convenience.
          </div>
        )}
      </MobileCard>

      {results && (
        <MobileCard className="p-3.5 flex items-center gap-3 border-l-4 border-l-[var(--ms-success-icon)]">
          <CheckCircle2 className="h-5 w-5 text-[var(--ms-success)] shrink-0" />
          <div className="text-[13px]">
            Sent <strong>{results.sent}</strong> reminder(s){results.failed > 0 ? `, ${results.failed} failed` : ""}.
          </div>
        </MobileCard>
      )}

      {filtered.length === 0 ? (
        <MobileCard>
          <MascotEmptyState
            variant="empty"
            size="md"
            title="No pending dues"
            message="All residents are up to date on rent."
          />
        </MobileCard>
      ) : (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[12px] font-medium text-[var(--ms-ink-3)]">
              {selectedIds.length} of {filtered.length} selected
            </span>
            <button
              type="button"
              onClick={toggleAll}
              className="text-[12px] font-semibold text-[var(--ms-brand-text)] cursor-pointer"
            >
              {selectedIds.length === filtered.length ? "Deselect all" : "Select all"}
            </button>
          </div>

          {filtered.map((item) => {
            const checked = selectedIds.includes(item.id);
            return (
              <MobileCard
                key={item.id}
                onClick={() => toggle(item.id)}
                className="p-3.5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={
                      checked
                        ? "h-6 w-6 rounded-lg bg-[var(--ms-brand-600)] text-white flex items-center justify-center shrink-0"
                        : "h-6 w-6 rounded-lg border-2 border-[var(--ms-border)] shrink-0"
                    }
                  >
                    {checked && <Check className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[14px] font-semibold text-[var(--ms-ink)] truncate">{item.name}</div>
                    <div className="text-[12px] text-[var(--ms-ink-3)]">Room {item.room}</div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[14px] font-semibold text-[var(--ms-error)] tabular-nums">
                    {formatINR(item.amount)}
                  </div>
                  <div className="mt-1">
                    <StatusChip
                      tone={item.status === "overdue" ? "error" : "pending"}
                      label={item.daysOverdue > 0 ? `Overdue ${item.daysOverdue}d` : item.status === "partial" ? "Partial" : "Pending"}
                    />
                  </div>
                </div>
              </MobileCard>
            );
          })}
        </div>
      )}

      {filtered.length > 0 && (
        <div
          className="fixed inset-x-0 bottom-0 z-30 bg-[var(--ms-card)] border-t border-[var(--ms-border)] p-4"
          style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))" }}
        >
          <PrimaryButton
            type="button"
            disabled={selectedIds.length === 0 || sending}
            onClick={() => setConfirmOpen(true)}
            className="w-full"
          >
            <Send className="h-4 w-4" />
            <span>{sending ? "Sending..." : `Send to ${selectedIds.length} tenant${selectedIds.length === 1 ? "" : "s"}`}</span>
          </PrimaryButton>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Send Rent Reminders?"
        description={`Send ${channel.toUpperCase()} reminder to ${selectedIds.length} selected resident(s)?`}
        confirmLabel="Send"
        onConfirm={() => void handleSend()}
      />
    </div>
  );
}
