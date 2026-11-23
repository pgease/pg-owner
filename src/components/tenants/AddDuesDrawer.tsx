import React, { useMemo, useState } from "react";
import { Search, Plus, FileText, IndianRupee, CheckCircle2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { postManualRentCollection, createTenantDue } from "@/api/propertyOwner";
import { useQueryClient } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatINR } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface AddDuesDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  roomTenantId: string;
  tenantName?: string;
  monthlyRent?: number;
  securityDeposit?: number;
  joiningFee?: number;
  existingDues?: Array<{ type?: string; title?: string; amount?: number; status?: string }>;
}

interface DueTypeItem {
  id: string;
  name: string;
}

const DUE_TYPES: DueTypeItem[] = [
  { id: "rent", name: "Rent" },
  { id: "security_deposit", name: "Security Deposit" },
  { id: "joining_fee", name: "Joining Fee" },
  { id: "kyc_verification", name: "KYC Verification Charge" },
  { id: "mess", name: "Mess" },
  { id: "electricity_bill", name: "Electricity Bill" },
  { id: "manual_late_fine", name: "Manual Late Fine" },
  { id: "wifi", name: "Wifi" },
  { id: "maintenance_bill", name: "Maintenance Bill" },
  { id: "laundry_bill", name: "Laundry Bill" },
  { id: "rental_agreement_charges", name: "Rental Agreement Charges" },
  { id: "3_months_rent_package", name: "3 Months Rent Package" },
  { id: "6_months_rent_package", name: "6 Months Rent Package" },
  { id: "9_months_rent_package", name: "9 Months Rent Package" },
  { id: "yearly_rent_package", name: "Yearly Rent Package" },
  { id: "weekly_rent_package", name: "Weekly Rent Package" },
  { id: "daily_rent_package", name: "Daily Rent Package" },
  { id: "others", name: "Others" },
];

function onFileAmount(id: string, monthlyRent?: number, securityDeposit?: number, joiningFee?: number): number | null {
  if (id === "rent" && monthlyRent && monthlyRent > 0) return monthlyRent;
  if (id === "security_deposit" && securityDeposit && securityDeposit > 0) return securityDeposit;
  if (id === "joining_fee" && joiningFee && joiningFee > 0) return joiningFee;
  return null;
}

export const AddDuesDrawer: React.FC<AddDuesDrawerProps> = ({
  open,
  onOpenChange,
  propertyId,
  roomTenantId,
  tenantName = "Tenant",
  monthlyRent = 0,
  securityDeposit = 0,
  joiningFee = 0,
  existingDues = [],
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDueType, setSelectedDueType] = useState<DueTypeItem | null>(null);

  const now = new Date();
  const [amount, setAmount] = useState<string>("");
  const [periodMonth, setPeriodMonth] = useState<number>(now.getMonth() + 1);
  const [periodYear, setPeriodYear] = useState<number>(now.getFullYear());
  const [dueDate, setDueDate] = useState<string>(now.toISOString().split("T")[0]);
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const billedByType = useMemo(() => {
    const map = new Map<string, number>();
    for (const due of existingDues) {
      const key = String(due.type || due.title || "").toLowerCase().replace(/\s+/g, "_");
      const amt = Number(due.amount || 0);
      if (!amt) continue;
      const status = String(due.status || "").toLowerCase();
      if (status === "paid" || status === "waived") continue;
      map.set(key, amt);
    }
    return map;
  }, [existingDues]);

  const filteredDues = DUE_TYPES.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const handleOpenModal = (dueType: DueTypeItem) => {
    setSelectedDueType(dueType);
    const pref = onFileAmount(dueType.id, monthlyRent, securityDeposit, joiningFee);
    setAmount(pref ? String(pref) : "");
    setNotes("");
  };

  const handleCreateDue = async () => {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      toast({
        title: "Enter valid amount",
        description: "Due amount must be greater than zero.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      try {
        await createTenantDue(
          roomTenantId,
          {
            dueType: selectedDueType?.name || "Other",
            title: `${selectedDueType?.name || "Due"} (${periodMonth}/${periodYear})`,
            amount: numAmount,
            description: notes.trim() || undefined,
            dueDate: dueDate || undefined,
          },
          propertyId
        );
      } catch (dueErr) {
        console.warn("createTenantDue endpoint failed, trying fallback to postManualRentCollection:", dueErr);
        await postManualRentCollection(propertyId, {
          roomTenantId,
          amountPaid: 0,
          status: "pending",
          dueType: selectedDueType?.name || "Other",
          periodMonth,
          periodYear,
          notes: notes.trim() || undefined,
          paymentMethod: "pending_invoice",
        });
      }

      toast({
        title: `${selectedDueType?.name || "Invoice"} Dues Created`,
        description: `Added ₹${numAmount.toLocaleString("en-IN")} due for ${tenantName}.`,
      });

      setSelectedDueType(null);
      onOpenChange(false);
      void queryClient.invalidateQueries({ queryKey: ["room-tenant", roomTenantId] });
      void queryClient.invalidateQueries({ queryKey: ["tenant-all-dues"] });
      void queryClient.invalidateQueries({ queryKey: ["rent-payments", propertyId] });
      void queryClient.invalidateQueries({ queryKey: ["rent-collection-dashboard"] });
    } catch (err: any) {
      toast({
        title: "Could not create dues",
        description: err?.message || "Please check details and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedOnFile = selectedDueType
    ? onFileAmount(selectedDueType.id, monthlyRent, securityDeposit, joiningFee)
    : null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className={cn(
            "w-full p-0 flex flex-col bg-white dark:bg-slate-900",
            isMobile ? "max-h-[90dvh] rounded-t-[24px]" : "sm:max-w-md"
          )}
        >
          <SheetHeader className="p-5 border-b border-slate-200 dark:border-slate-800 space-y-3">
            <div>
              <SheetTitle className="text-base font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#008080]" />
                Add dues
              </SheetTitle>
              <SheetDescription className="text-xs mt-1">
                For {tenantName}. Amounts already on this stay are pre-filled.
              </SheetDescription>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2">
                <p className="text-[10px] uppercase tracking-wide text-slate-500">Rent</p>
                <p className="text-sm font-semibold tabular-nums text-slate-900">
                  {monthlyRent > 0 ? formatINR(monthlyRent) : "—"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2">
                <p className="text-[10px] uppercase tracking-wide text-slate-500">Security</p>
                <p className="text-sm font-semibold tabular-nums text-slate-900">
                  {securityDeposit > 0 ? formatINR(securityDeposit) : "—"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2">
                <p className="text-[10px] uppercase tracking-wide text-slate-500">Joining</p>
                <p className="text-sm font-semibold tabular-nums text-slate-900">
                  {joiningFee > 0 ? formatINR(joiningFee) : "—"}
                </p>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Search dues types..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 text-sm"
              />
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {filteredDues.map((item) => {
              const pref = onFileAmount(item.id, monthlyRent, securityDeposit, joiningFee);
              const billed =
                billedByType.get(item.id) ||
                billedByType.get(item.name.toLowerCase().replace(/\s+/g, "_"));
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-[#008080]/50 hover:bg-[#008080]/[0.03] transition-colors"
                >
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-slate-900">{item.name}</h4>
                    {pref ? (
                      <p className="text-[12px] text-[#006666] font-medium">
                        On file: {formatINR(pref)} — will pre-fill
                      </p>
                    ) : billed ? (
                      <p className="text-[12px] text-amber-700">Already billed: {formatINR(billed)}</p>
                    ) : (
                      <p className="text-[12px] text-slate-500">No amount on file yet</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    className="h-9 shrink-0 rounded-full px-3 text-xs bg-[#008080] hover:bg-[#006666] text-white gap-1"
                    onClick={() => handleOpenModal(item)}
                  >
                    <Plus className="h-3.5 w-3.5" /> Add
                  </Button>
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={Boolean(selectedDueType)} onOpenChange={(o) => !o && setSelectedDueType(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-[#008080]" />
              Add {selectedDueType?.name}
            </DialogTitle>
          </DialogHeader>

          {selectedOnFile ? (
            <div className="flex items-start gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2.5 text-xs text-teal-900">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-teal-700" />
              <p>
                This stay already has <span className="font-semibold">{formatINR(selectedOnFile)}</span>{" "}
                {selectedDueType?.name?.toLowerCase()} on file. Amount is pre-filled — change it only if this invoice is different.
              </p>
            </div>
          ) : null}

          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Amount (₹)</Label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-11 text-base"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Billing Month</Label>
                <select
                  value={periodMonth}
                  onChange={(e) => setPeriodMonth(Number(e.target.value))}
                  className="w-full h-10 px-2 text-sm rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                >
                  {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, idx) => (
                    <option key={m} value={idx + 1}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Billing Year</Label>
                <select
                  value={periodYear}
                  onChange={(e) => setPeriodYear(Number(e.target.value))}
                  className="w-full h-10 px-2 text-sm rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                >
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Due Date</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-10 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Notes (optional)</Label>
              <Textarea
                placeholder="Add billing remarks..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="text-sm"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setSelectedDueType(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-[#008080] hover:bg-[#006666] text-white font-semibold"
              onClick={handleCreateDue}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create due"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
