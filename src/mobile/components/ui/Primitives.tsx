import React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatINR } from "@/mobile/utils/formatters";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function MobileCard({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "ms-card w-full text-left p-4 transition-transform",
        onClick && "active:scale-[0.99] cursor-pointer",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function StatTile({
  icon,
  value,
  label,
  onClick,
  iconBgClass = "bg-[var(--ms-brand-50)] text-[var(--ms-brand-text)]",
  className,
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
  onClick?: () => void;
  iconBgClass?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "ms-tile w-full p-3.5 text-left flex flex-col justify-between gap-2.5 min-h-[104px] transition-transform active:scale-[0.98] cursor-pointer",
        className,
      )}
    >
      <div className="flex items-center justify-between w-full">
        <span className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", iconBgClass)}>
          {icon}
        </span>
        {onClick && <ChevronRight className="h-4 w-4 text-[var(--ms-ink-3)] shrink-0" />}
      </div>
      <div>
        <div className="text-[22px] leading-tight font-semibold tracking-tight text-[var(--ms-ink)] tabular-nums truncate">
          {value}
        </div>
        <div className="text-[12px] leading-4 text-[var(--ms-ink-3)] mt-0.5 truncate">{label}</div>
      </div>
    </button>
  );
}

export function SectionHeader({
  title,
  actionLabel,
  onAction,
  right,
  className,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-2", className)}>
      <h2 className="text-[16px] font-semibold text-[var(--ms-ink)] tracking-tight">{title}</h2>
      {right ? (
        right
      ) : actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="px-3 py-1 rounded-full bg-[var(--ms-brand-50)] text-[var(--ms-brand-text)] text-[12px] font-medium min-h-[32px] active:scale-95 transition-transform cursor-pointer"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export function ListRow({
  icon,
  title,
  subtitle,
  badge,
  right,
  onClick,
  danger,
  disabled,
  iconBgClass,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  right?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
  iconBgClass?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 text-left min-h-[56px] transition-colors active:bg-[var(--ms-page)] cursor-pointer",
        disabled && "opacity-40 cursor-not-allowed",
        className,
      )}
    >
      <span
        className={cn(
          "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
          iconBgClass ||
            (danger
              ? "bg-[var(--ms-error-bg)] text-[var(--ms-error)]"
              : "bg-[var(--ms-brand-50)] text-[var(--ms-brand-text)]"),
        )}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className={cn("text-[14px] font-medium truncate", danger ? "text-[var(--ms-error)]" : "text-[var(--ms-ink)]")}>
          {title}
        </div>
        {subtitle && <div className="text-[12px] text-[var(--ms-ink-3)] truncate mt-0.5">{subtitle}</div>}
      </div>
      {badge}
      {right !== undefined ? right : <ChevronRight className="h-4 w-4 text-[var(--ms-ink-3)] shrink-0" />}
    </button>
  );
}

export function FilterChips<T extends string>({
  items,
  value,
  onChange,
  className,
}: {
  items: Array<{ id: T; label: string; count?: number }>;
  value: T;
  onChange: (id: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2 overflow-x-auto ms-no-scrollbar py-0.5", className)}>
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={cn(
              "shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-medium min-h-[36px] border transition-colors cursor-pointer",
              active
                ? "bg-[var(--ms-brand-600)] text-white border-[var(--ms-brand-600)]"
                : "bg-[var(--ms-card)] text-[var(--ms-ink-2)] border-[var(--ms-border)]",
            )}
          >
            {item.label}
            {item.count !== undefined ? ` (${item.count})` : ""}
          </button>
        );
      })}
    </div>
  );
}

export function SegmentedTabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: Array<{ id: T; label: string; badge?: number }>;
  value: T;
  onChange: (id: T) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 overflow-x-auto ms-no-scrollbar p-1 rounded-2xl bg-[var(--ms-card)] border border-[var(--ms-border)]",
        className,
      )}
    >
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-medium min-h-[40px] transition-all cursor-pointer",
              active
                ? "bg-[var(--ms-brand-600)] text-white shadow-sm"
                : "text-[var(--ms-ink-2)] hover:text-[var(--ms-ink)]",
            )}
          >
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded-full text-[10px] font-semibold leading-none",
                  active ? "bg-white/20 text-white" : "bg-[var(--ms-brand-50)] text-[var(--ms-brand-text)]",
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function PrimaryButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "ms-btn-primary inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[14px] font-semibold disabled:opacity-40 cursor-pointer",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function OutlineButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[14px] min-h-[44px] border border-[var(--ms-brand-600)] text-[var(--ms-brand-text)] bg-[var(--ms-card)] text-[14px] font-semibold active:scale-[0.98] transition-transform disabled:opacity-40 cursor-pointer",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function DangerButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[14px] min-h-[44px] border border-[var(--ms-error)] text-[var(--ms-error)] bg-[var(--ms-card)] text-[14px] font-semibold active:scale-[0.98] transition-transform disabled:opacity-40 cursor-pointer",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function ExtendedFAB({
  icon,
  label,
  onClick,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ boxShadow: "var(--ms-shadow-float)" }}
      className={cn(
        "fixed right-4 z-30 inline-flex items-center gap-2 px-4 h-12 rounded-2xl bg-[var(--ms-brand-600)] text-white text-[14px] font-semibold active:scale-95 transition-transform cursor-pointer",
        className,
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}
        className="ms-anim-sheet w-full max-w-lg rounded-t-[24px] bg-[var(--ms-card)] text-[var(--ms-ink)] p-4 pt-3 shadow-2xl max-h-[85dvh] overflow-y-auto"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[var(--ms-border)]" />
        {title && <h3 className="text-[16px] font-semibold mb-3 px-1">{title}</h3>}
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[340px] rounded-[20px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row gap-2 justify-end">
          <OutlineButton
            type="button"
            className="border-[var(--ms-border)] text-[var(--ms-ink)]"
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </OutlineButton>
          {destructive ? (
            <DangerButton
              type="button"
              className="bg-[var(--ms-error)] text-white"
              onClick={() => {
                onOpenChange(false);
                onConfirm();
              }}
            >
              {confirmLabel}
            </DangerButton>
          ) : (
            <PrimaryButton
              type="button"
              onClick={() => {
                onOpenChange(false);
                onConfirm();
              }}
            >
              {confirmLabel}
            </PrimaryButton>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-[var(--ms-border)]/70", className)} />;
}

export function OccupancyRing({
  pct,
  size = 84,
  strokeWidth = 8,
}: {
  pct: number;
  size?: number;
  strokeWidth?: number;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (clamped / 100) * circ;
  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--ms-brand-100)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--ms-brand-600)"
          strokeWidth={strokeWidth}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[16px] font-semibold leading-none text-[var(--ms-ink)] tabular-nums">{clamped}%</span>
        <span className="text-[11px] text-[var(--ms-ink-3)] mt-0.5">full</span>
      </div>
    </div>
  );
}

export function Avatar({
  name,
  src,
  size = 44,
}: {
  name: string;
  src?: string | null;
  size?: number;
}) {
  const initials = (name || "PG").trim().slice(0, 1).toUpperCase();
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        loading="lazy"
        style={{ width: size, height: size }}
        className="rounded-full object-cover shrink-0 border border-[var(--ms-border)]"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-[var(--ms-brand-600)] text-white font-semibold flex items-center justify-center shrink-0 text-[16px]"
    >
      {initials}
    </div>
  );
}

export function StatusChip({
  label,
  tone = "teal",
  icon,
  onClick,
}: {
  label: string;
  tone?: "teal" | "pending" | "success" | "error" | "neutral";
  icon?: React.ReactNode;
  onClick?: () => void;
}) {
  const toneClasses: Record<string, string> = {
    teal: "bg-[var(--ms-brand-50)] text-[var(--ms-brand-text)] border-[var(--ms-brand-100)]",
    pending: "bg-[var(--ms-brand-50)] text-[var(--ms-brand-800)] dark:text-[var(--ms-brand-text)] border-[var(--ms-brand-600)]/30",
    success: "bg-[var(--ms-success-bg)] text-[var(--ms-success)] border-[var(--ms-success)]/25",
    error: "bg-[var(--ms-error-bg)] text-[var(--ms-error)] border-[var(--ms-error)]/25",
    neutral: "bg-[var(--ms-page)] text-[var(--ms-ink-3)] border-[var(--ms-border)]",
  };
  const Tag = onClick ? "button" : "span";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border shrink-0",
        toneClasses[tone],
        onClick && "cursor-pointer active:scale-95 transition-transform",
      )}
    >
      {icon}
      <span>{label}</span>
    </Tag>
  );
}

export function MoneyText({
  amount,
  compact,
  className,
}: {
  amount: unknown;
  compact?: boolean;
  className?: string;
}) {
  return <span className={cn("tabular-nums", className)}>{formatINR(amount, { compact })}</span>;
}
