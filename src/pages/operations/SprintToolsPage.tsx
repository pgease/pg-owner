import { useEffect, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/context/AppContext";
import { toast } from "@/components/ui/use-toast";
import { createOps, deleteOps, listOps, type OpsRecord } from "@/api/ownerOps";

const TOOLS = [
  { kind: "hold", title: "Hold bookings", hint: "Reserve a bed and record the advance. Convert or cancel later." },
  { kind: "meter_reading", title: "EB meter", hint: "Save the room, previous reading, current reading, and rate." },
  { kind: "join_request", title: "QR join requests", hint: "People who asked to join. Assign a bed when you approve them." },
  { kind: "complaint_comment", title: "Complaint notes", hint: "A comment, photo note, or assignee for a complaint." },
  { kind: "asset", title: "Room assets", hint: "AC, geyser, furniture, or a damage note." },
  { kind: "vehicle", title: "Vehicles", hint: "A tenant vehicle for the parking register." },
  { kind: "task", title: "Staff tasks", hint: "Work assigned to a staff member." },
  { kind: "attendance", title: "Attendance", hint: "Who was present for a session." },
  { kind: "checklist", title: "Checklists", hint: "Daily maintenance or room cleaning ticks." },
  { kind: "survey", title: "Surveys", hint: "A cleanliness or feedback response." },
  { kind: "house_rule", title: "Rule acceptance", hint: "Which tenant accepted which house rule." },
  { kind: "discount", title: "Discounts", hint: "A discount that is not collected rent." },
  { kind: "bulk_due", title: "Bulk dues", hint: "One charge applied to many tenants, such as Wi-Fi." },
  { kind: "payment_proof", title: "Payment proofs", hint: "A tenant screenshot waiting for approval." },
  { kind: "report_schedule", title: "Scheduled reports", hint: "When a PDF or Excel should be sent." },
  { kind: "support_message", title: "Support chat", hint: "A message to PG Ease support." },
  { kind: "announcement", title: "Announcements", hint: "A notice template you have sent." },
];

export default function SprintToolsPage() {
  const { selectedPgId } = useApp();
  const [kind, setKind] = useState(TOOLS[0].kind);
  const [items, setItems] = useState<OpsRecord[]>([]);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [amount, setAmount] = useState("");
  const tool = TOOLS.find((item) => item.kind === kind) || TOOLS[0];

  const load = async (nextKind = kind) => {
    if (!selectedPgId) return;
    try {
      setItems(await listOps(selectedPgId, nextKind));
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Could not load records", variant: "destructive" });
    }
  };

  useEffect(() => {
    void load(kind);
  }, [selectedPgId, kind]);

  const save = async () => {
    if (!selectedPgId || !title.trim()) {
      toast({ title: "Enter a title", variant: "destructive" });
      return;
    }
    await createOps(selectedPgId, kind, {
      title: title.trim(),
      notes: notes.trim(),
      amount: amount ? Number(amount) : undefined,
    });
    setTitle("");
    setNotes("");
    setAmount("");
    toast({ title: "Saved" });
    await load();
  };

  return (
    <div className="space-y-4 max-w-5xl">
      <PageHeader
        title="Property tools"
        description="These records are saved for the selected PG and are available on any browser where you sign in."
      />
      <div className="flex flex-wrap gap-2">
        {TOOLS.map((item) => (
          <Button key={item.kind} type="button" size="sm" variant={item.kind === kind ? "default" : "outline"} onClick={() => setKind(item.kind)}>
            {item.title}
          </Button>
        ))}
      </div>
      <p className="text-sm text-[var(--gray-600)]">{tool.hint}</p>
      <div className="grid gap-3 rounded-md border border-[var(--gray-200)] bg-white p-4 md:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="ops-title">Title</Label>
          <Input id="ops-title" value={title} onChange={(event) => setTitle(event.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ops-amount">Amount (optional)</Label>
          <Input id="ops-amount" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} />
        </div>
        <div className="space-y-1 md:col-span-3">
          <Label htmlFor="ops-notes">Notes</Label>
          <Textarea id="ops-notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
        </div>
        <Button type="button" onClick={() => void save()}>Save record</Button>
      </div>
      <div className="space-y-2">
        {items.length === 0 ? <p className="text-sm text-[var(--gray-600)]">No records yet.</p> : null}
        {items.map((item) => (
          <div key={item.id} className="flex items-start justify-between gap-3 rounded-md border border-[var(--gray-200)] bg-white p-3">
            <div>
              <p className="text-sm font-semibold">{String(item.title || "Record")}</p>
              <p className="text-xs text-[var(--gray-600)]">{String(item.notes || "")}</p>
              {item.amount != null ? <p className="text-xs">₹{String(item.amount)}</p> : null}
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={async () => {
                if (!selectedPgId) return;
                await deleteOps(selectedPgId, kind, item.id);
                await load();
              }}
            >
              Delete
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
