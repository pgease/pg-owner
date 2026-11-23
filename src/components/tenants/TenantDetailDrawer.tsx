import React from "react";
import { Link } from "react-router-dom";
import {
  Phone,
  MessageCircle,
  IndianRupee,
  ShieldCheck,
  Clock,
  ArrowRightLeft,
  UserMinus,
  ExternalLink,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import type { PropertyTenant } from "@/api/propertyOwner";
import {
  tenantDisplayName,
  tenantPhone,
  tenantRentAmount,
  tenantRentDueLabel,
  tenantRoomNo,
  tenantVerificationLabel,
  tenantStayStatus,
  tenantBlock,
  tenantFloor,
  tenantBedNo,
  tenantCode,
  tenantSecurityDepositValue,
} from "@/lib/tenantDisplay";
import { formatDate, formatINR } from "@/lib/formatters";
import { TenantAvatar } from "@/components/tenants/TenantAvatar";

interface TenantDetailDrawerProps {
  tenant: PropertyTenant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMoveTenant?: (tenant: PropertyTenant) => void;
  onNoticeTenant?: (tenant: PropertyTenant) => void;
  onVacateTenant?: (tenant: PropertyTenant) => void;
  onRecordPayment?: (tenant: PropertyTenant) => void;
  onSendReminder?: (tenant: PropertyTenant) => void;
}

export const TenantDetailDrawer: React.FC<TenantDetailDrawerProps> = ({
  tenant,
  open,
  onOpenChange,
  onMoveTenant,
  onNoticeTenant,
  onVacateTenant,
  onRecordPayment,
  onSendReminder,
}) => {
  if (!tenant) return null;

  const phone = tenantPhone(tenant);
  const cleanPhone = phone !== "—" ? phone.replace(/\D/g, "") : "";
  const wa = cleanPhone.length >= 10 ? `https://wa.me/${cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone}` : null;
  const isVerified = tenantVerificationLabel(tenant) === "verified";
  const stay = tenantStayStatus(tenant);
  const room = tenantRoomNo(tenant);
  const bed = tenantBedNo(tenant);
  const block = tenantBlock(tenant);
  const floor = tenantFloor(tenant);
  const code = tenantCode(tenant);
  const joiningDate = (tenant as any).roomTenant?.startDate || tenant.createdAt;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[480px] p-0 flex flex-col bg-white border-l border-[var(--gray-200)] shadow-overlay"
      >
        <SheetHeader className="p-4 sm:p-5 border-b border-[var(--gray-200)] bg-white text-left shrink-0">
          <div className="flex items-center gap-3">
            <TenantAvatar tenant={tenant} className="h-12 w-12 shrink-0 text-sm" />
            <div className="min-w-0">
              <SheetTitle className="text-base font-semibold text-[var(--gray-900)] truncate">
                {tenantDisplayName(tenant)}
              </SheetTitle>
              <p className="text-xs text-[var(--gray-500)] mt-0.5">
                {phone}
                {code ? ` · ${code}` : ""}
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <StatusBadge
                  status={stay === "UNDER_NOTICE" ? "on_notice" : stay === "MOVED_OUT" ? "moved_out" : "occupied"}
                  size="sm"
                />
                <StatusBadge
                  status={isVerified ? "kyc_completed" : "kyc_pending"}
                  size="sm"
                />
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-[var(--gray-200)]">
            {[
              ["Room", room !== "—" ? room : "Unassigned"],
              ["Bed", bed !== "—" ? bed : "—"],
              ["Rent", tenantRentAmount(tenant)],
              ["Deposit", tenantSecurityDepositValue(tenant) ? formatINR(tenantSecurityDepositValue(tenant)!) : "—"],
              ["Next due", tenantRentDueLabel(tenant)],
              ["Joined", formatDate(joiningDate)],
            ].map(([label, value]) => (
              <div key={label} className="border-b border-r border-[var(--gray-200)] px-3 py-2.5 odd:border-r">
                <p className="text-[11px] text-[var(--gray-500)]">{label}</p>
                <p className="text-sm font-semibold text-[var(--gray-900)] tabular-nums">{value}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-[var(--gray-500)]">
            {[block !== "—" ? block : null, floor !== "—" ? floor : null].filter(Boolean).join(" · ") || "Room assignment is on the full profile."}
          </p>

          {/* Quick Contact & Action Buttons */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-[var(--gray-600)] uppercase tracking-wider block">
              Operations
            </span>
            <div className="grid grid-cols-2 gap-2">
              {phone !== "—" && (
                <Button variant="secondary" size="sm" asChild className="gap-1.5 justify-start text-xs">
                  <a href={`tel:${cleanPhone}`}>
                    <Phone className="h-3.5 w-3.5 text-emerald-600" /> Call Tenant
                  </a>
                </Button>
              )}
              {wa && (
                <Button variant="secondary" size="sm" asChild className="gap-1.5 justify-start text-xs">
                  <a href={wa} target="_blank" rel="noreferrer">
                    <MessageCircle className="h-3.5 w-3.5 text-emerald-600" /> WhatsApp
                  </a>
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                className="gap-1.5 justify-start text-xs"
                onClick={() => {
                  onOpenChange(false);
                  onMoveTenant?.(tenant);
                }}
              >
                <ArrowRightLeft className="h-3.5 w-3.5 text-[var(--gray-600)]" /> Move Tenant
              </Button>
              {stay !== "UNDER_NOTICE" && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-1.5 justify-start text-xs"
                  onClick={() => {
                    onOpenChange(false);
                    onNoticeTenant?.(tenant);
                  }}
                >
                  <Clock className="h-3.5 w-3.5 text-amber-600" /> Initiate Notice
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                className="gap-1.5 justify-start text-xs text-[#B42318] hover:bg-[#FEF1F0]"
                onClick={() => {
                  onOpenChange(false);
                  onVacateTenant?.(tenant);
                }}
              >
                <UserMinus className="h-3.5 w-3.5" /> Move Out
              </Button>
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="p-3 sm:p-4 border-t border-[var(--gray-200)] bg-[var(--gray-50)] flex items-center justify-between gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-xs text-[var(--brand-600)] hover:text-[var(--brand-700)]"
          >
            <Link to={`/tenants/${tenant.id}`}>
              Full Profile <ExternalLink className="h-3.5 w-3.5 ml-1" />
            </Link>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onSendReminder?.(tenant);
              }}
            >
              Send reminder
            </Button>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => {
                onOpenChange(false);
                onRecordPayment?.(tenant);
              }}
            >
              <IndianRupee className="h-3.5 w-3.5" /> Record payment
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
