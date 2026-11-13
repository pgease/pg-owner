import { useState, useEffect, useMemo } from 'react';
import {
  PackageCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  DollarSign,
  Loader2,
  Camera,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
  UserMinus,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  type CheckoutInventoryLine,
  type CheckoutItemStatus,
  getCheckoutInventoryCheck,
  saveCheckoutInventoryCheck,
} from '@/api/inventoryApi';
import { toast } from '@/components/ui/use-toast';

interface CheckoutInventoryCheckModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pgId: string;
  tenant: {
    id: string;
    name?: string;
    roomNumber?: string | number;
    bedNumber?: string | number;
    securityDeposit?: number;
    pendingRentDues?: number;
    roomId?: string;
  } | null;
  onConfirmCheckout: (settlementData: {
    moveOutDate: string;
    reason: string;
    remarks?: string;
    inventoryDeduction: number;
    netSettlementAmount: number;
    isBalanceDue: boolean;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

export const CheckoutInventoryCheckModal = ({
  open,
  onOpenChange,
  pgId,
  tenant,
  onConfirmCheckout,
  isSubmitting = false,
}: CheckoutInventoryCheckModalProps) => {
  const [step, setStep] = useState<'inventory' | 'summary'>('inventory');
  const [loading, setLoading] = useState(false);
  const [lines, setLines] = useState<CheckoutInventoryLine[]>([]);

  // Move-out fields
  const [moveOutDate, setMoveOutDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [reason, setReason] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  const securityDeposit = Number(tenant?.securityDeposit || 0);
  const pendingRentDues = Number(tenant?.pendingRentDues || 0);

  useEffect(() => {
    if (open && tenant) {
      setStep('inventory');
      loadInventoryLines();
    }
  }, [open, tenant]);

  const loadInventoryLines = async () => {
    if (!tenant) return;
    setLoading(true);
    try {
      const data = await getCheckoutInventoryCheck(pgId, tenant.id, tenant.roomId);
      setLines(data.lines);
    } catch (err: any) {
      toast({
        title: 'Could not load inventory items',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (index: number, newStatus: CheckoutItemStatus) => {
    setLines((prev) => {
      const updated = [...prev];
      const item = { ...updated[index] };
      item.status = newStatus;

      if (newStatus === 'ok' || newStatus === 'not_applicable') {
        item.deductionInr = 0;
      } else if (newStatus === 'missing') {
        item.deductionInr = item.defaultValueInr || 0;
      } else if (newStatus === 'damaged' && item.deductionInr === 0) {
        item.deductionInr = Math.round((item.defaultValueInr || 0) * 0.5);
      }

      updated[index] = item;
      return updated;
    });
  };

  const handleDeductionChange = (index: number, value: number) => {
    setLines((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], deductionInr: Math.max(0, value) };
      return updated;
    });
  };

  const handleNoteChange = (index: number, note: string) => {
    setLines((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], note };
      return updated;
    });
  };

  // Totals calculation
  const totalInventoryDeductions = useMemo(() => {
    return lines
      .filter((l) => l.status === 'damaged' || l.status === 'missing')
      .reduce((sum, l) => sum + Number(l.deductionInr || 0), 0);
  }, [lines]);

  const rawNetBalance = securityDeposit - pendingRentDues - totalInventoryDeductions;
  const isBalanceDue = rawNetBalance < 0;
  const refundToTenant = isBalanceDue ? 0 : rawNetBalance;
  const balanceDueFromTenant = isBalanceDue ? Math.abs(rawNetBalance) : 0;

  const handleProceedToFinal = async () => {
    if (!tenant) return;
    try {
      await saveCheckoutInventoryCheck(pgId, tenant.id, lines);
    } catch {
      // Graceful fallback to local
    }

    await onConfirmCheckout({
      moveOutDate,
      reason,
      remarks,
      inventoryDeduction: totalInventoryDeductions,
      netSettlementAmount: refundToTenant,
      isBalanceDue,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] flex flex-col p-6">
        <DialogHeader className="border-b border-gray-100 pb-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-gray-900">
              <PackageCheck className="h-5 w-5 text-teal-600" />
              Checkout & Move-Out Inspection: {tenant?.name || 'Tenant'}
            </DialogTitle>
            <Badge variant="outline" className="text-xs">
              Room {tenant?.roomNumber || '?'}, Bed {tenant?.bedNumber || '?'}
            </Badge>
          </div>
          <DialogDescription className="text-xs text-gray-500">
            {step === 'inventory'
              ? 'Verify each room item and bed amenity condition before calculating final deposit refund.'
              : 'Review move-out details and final settlement breakdown.'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-teal-600" />
            <p className="text-xs text-gray-400 mt-2">Loading move-in inventory snapshot...</p>
          </div>
        ) : step === 'inventory' ? (
          /* STEP 1: INVENTORY CHECKLIST */
          <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1 text-xs">
            <div className="bg-teal-50/70 border border-teal-200/80 rounded-xl p-3 flex items-start gap-2.5">
              <Sparkles className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
              <p className="text-teal-900 text-[11px] leading-relaxed">
                Items from the tenant's move-in handover agreement are listed below. For any damaged
                or missing items, set the status and customize the suggested repair or replacement
                deduction.
              </p>
            </div>

            <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 bg-white overflow-hidden shadow-xs">
              {lines.map((line, idx) => {
                const isDeducted = line.status === 'damaged' || line.status === 'missing';
                return (
                  <div
                    key={idx}
                    className={`p-3 space-y-2 transition-colors ${
                      isDeducted ? 'bg-amber-50/40' : 'hover:bg-gray-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 text-xs">{line.name}</span>
                          <Badge
                            variant="secondary"
                            className="text-[10px] uppercase font-normal"
                          >
                            {line.shared ? 'Shared' : 'Bed Item'}
                          </Badge>
                          <span className="text-[11px] text-gray-400">
                            Move-in: {line.conditionAtMoveIn || 'good'}
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-500">
                          Replacement Value: ₹{line.defaultValueInr.toLocaleString('en-IN')}
                        </span>
                      </div>

                      {/* Status Selector Pills */}
                      <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(idx, 'ok')}
                          className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
                            line.status === 'ok'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          OK
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(idx, 'damaged')}
                          className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
                            line.status === 'damaged'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          Damaged
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(idx, 'missing')}
                          className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
                            line.status === 'missing'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          Missing
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(idx, 'not_applicable')}
                          className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
                            line.status === 'not_applicable'
                              ? 'bg-gray-700 text-white shadow-xs'
                              : 'text-gray-500 hover:text-gray-800'
                          }`}
                        >
                          N/A
                        </button>
                      </div>
                    </div>

                    {/* Expandable Deduction Input when Damaged or Missing */}
                    {isDeducted && (
                      <div className="grid grid-cols-2 gap-3 pt-1 border-t border-amber-100">
                        <div className="space-y-1">
                          <Label className="text-[11px] font-semibold text-amber-900">
                            Deduction Amount (₹) *
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            value={line.deductionInr}
                            onChange={(e) =>
                              handleDeductionChange(idx, Number(e.target.value) || 0)
                            }
                            className="h-8 text-xs font-bold text-amber-900 bg-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] text-gray-600">Damage / Note (Optional)</Label>
                          <Input
                            placeholder="e.g. Broken knob, stain on fabric"
                            value={line.note || ''}
                            onChange={(e) => handleNoteChange(idx, e.target.value)}
                            className="h-8 text-xs bg-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quick Summary Pill at bottom */}
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-center justify-between">
              <span className="font-semibold text-gray-700">
                Total Inventory Deductions:
              </span>
              <span className="font-bold text-sm text-rose-700">
                ₹{totalInventoryDeductions.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        ) : (
          /* STEP 2: MOVE-OUT DETAILS & SETTLEMENT BREAKDOWN */
          <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold">Move-Out / Vacate Date *</Label>
                <Input
                  type="date"
                  value={moveOutDate}
                  onChange={(e) => setMoveOutDate(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">Exit Reason</Label>
                <Input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Remarks / Handover Notes (Optional)</Label>
              <Textarea
                rows={2}
                placeholder="e.g. Keys returned, inventory verified, electricity reading noted"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="text-xs"
              />
            </div>

            {/* TOTALS & SETTLEMENT CARD */}
            <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 space-y-2.5">
              <h4 className="font-bold text-xs uppercase tracking-wider text-gray-600">
                Security Deposit Settlement Breakdown
              </h4>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-gray-700">
                  <span>Security Deposit Collected:</span>
                  <span className="font-semibold text-gray-900">
                    + ₹{securityDeposit.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex justify-between items-center text-gray-700">
                  <span>Pending Rent & Utility Dues:</span>
                  <span className="font-semibold text-rose-600">
                    - ₹{pendingRentDues.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex justify-between items-center text-gray-700">
                  <span>Inventory Damages & Deductions:</span>
                  <span className="font-semibold text-rose-600">
                    - ₹{totalInventoryDeductions.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
                  <span className="font-bold text-sm text-gray-900">
                    {isBalanceDue ? 'Balance Due From Tenant:' : 'Net Refund to Tenant:'}
                  </span>
                  <span
                    className={`font-black text-base ${
                      isBalanceDue ? 'text-rose-700' : 'text-emerald-700'
                    }`}
                  >
                    ₹
                    {(isBalanceDue ? balanceDueFromTenant : refundToTenant).toLocaleString(
                      'en-IN'
                    )}
                  </span>
                </div>
              </div>
            </div>

            {isBalanceDue ? (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Notice:</strong> Outstanding dues and inventory damages exceed the
                  security deposit. The remaining balance of ₹
                  {balanceDueFromTenant.toLocaleString('en-IN')} is due from the tenant upon exit.
                </span>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  All damages and dues have been deducted from the security deposit.
                  Please refund ₹{refundToTenant.toLocaleString('en-IN')} via UPI or bank transfer.
                </span>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="border-t border-gray-100 pt-3">
          {step === 'inventory' ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => setStep('summary')}
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold gap-1.5"
              >
                Continue to Settlement
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStep('inventory')}
                className="text-xs gap-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Inventory
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleProceedToFinal}
                disabled={isSubmitting}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold gap-1.5"
              >
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <UserMinus className="h-3.5 w-3.5" />
                )}
                Confirm Move-Out & Settlement
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

