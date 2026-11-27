import React, { useRef, useState } from "react";
import { ChevronRight, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatINR } from "@/mobile/utils/formatters";
import type { IconTone } from "@/mobile/tokens";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const TONE_STYLE: Record<IconTone, { bg: string; fg: string }> = {
  teal: { bg: "var(--ms-tone-teal-bg)", fg: "var(--ms-tone-teal-fg)" },
  blue: { bg: "var(--ms-tone-blue-bg)", fg: "var(--ms-tone-blue-fg)" },
  green: { bg: "var(--ms-tone-green-bg)", fg: "var(--ms-tone-green-fg)" },
  emerald: { bg: "var(--ms-tone-emerald-bg)", fg: "var(--ms-tone-emerald-fg)" },
  amber: { bg: "var(--ms-tone-amber-bg)", fg: "var(--ms-tone-amber-fg)" },
  orange: { bg: "var(--ms-tone-orange-bg)", fg: "var(--ms-tone-orange-fg)" },
  rose: { bg: "var(--ms-tone-rose-bg)", fg: "var(--ms-tone-rose-fg)" },
  red: { bg: "var(--ms-tone-red-bg)", fg: "var(--ms-tone-red-fg)" },
  indigo: { bg: "var(--ms-tone-indigo-bg)", fg: "var(--ms-tone-indigo-fg)" },
  violet: { bg: "var(--ms-tone-violet-bg)", fg: "var(--ms-tone-violet-fg)" },
  sky: { bg: "var(--ms-tone-sky-bg)", fg: "var(--ms-tone-sky-fg)" },
};

export function IconTile({
  icon,
  tone = "teal",
  size = "md",
  className,
}: {
  icon: React.ReactNode;
  tone?: IconTone;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClass = {
    sm: "h-8 w-8 rounded-lg",
    md: "h-10 w-10 rounded-xl",
    lg: "h-12 w-12 rounded-2xl",
  }[size];
  const palette = TONE_STYLE[tone] || TONE_STYLE.teal;
  return (
    <span
      style={{ backgroundColor: palette.bg, color: palette.fg }}
      className={cn("flex items-center justify-center shrink-0", sizeClass, className)}
    >
      {icon}
    </span>
  );
}

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
  tone = "teal",
  iconBgClass,
  className,
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
  onClick?: () => void;
  tone?: IconTone;
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
        {iconBgClass ? (
          <span className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", iconBgClass)}>
            {icon}
          </span>
        ) : (
          <IconTile icon={icon} tone={tone} size="md" className="h-9 w-9" />
        )}
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
  tone = "teal",
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
  tone?: IconTone;
  iconBgClass?: string;
  className?: string;
}) {
  const effectiveTone: IconTone = danger ? "red" : tone;
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
      {iconBgClass ? (
        <span className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", iconBgClass)}>
          {icon}
        </span>
      ) : (
        <IconTile icon={icon} tone={effectiveTone} size="md" />
      )}
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
  items: Array<{ id: NoInfer<T>; label: string; count?: number }>;
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
  return <SwipeTabs tabs={tabs} value={value} onChange={onChange} className={className} />;
}

/**
 * R5: Shared SwipeTabs component with animated sliding indicator, horizontal swipe
 * gesture on wrapped panel content, vertical scroll lock, and left-edge back safety.
 */
export function SwipeTabs<T extends string>({
  tabs,
  value,
  onChange,
  children,
  className,
  contentClassName,
}: {
  tabs: Array<{ id: NoInfer<T>; label: string; badge?: number }>;
  value: T;
  onChange: (id: T) => void;
  children?: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  const activeIndex = Math.max(
    0,
    tabs.findIndex((t) => t.id === value),
  );
  const equalGrid = tabs.length > 0 && tabs.length <= 4;

  const gestureRef = useRef<{
    startX: number;
    startY: number;
    lock: "horizontal" | "vertical" | null;
    edgeSkip: boolean;
  } | null>(null);
  const [dragOffset, setDragOffset] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!children || tabs.length <= 1 || e.touches.length !== 1) return;
    const t = e.touches[0];
    gestureRef.current = {
      startX: t.clientX,
      startY: t.clientY,
      lock: null,
      edgeSkip: t.clientX < 28,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const g = gestureRef.current;
    if (!g || g.edgeSkip || e.touches.length !== 1) return;
    const t = e.touches[0];
    const dx = t.clientX - g.startX;
    const dy = t.clientY - g.startY;
    if (!g.lock) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
        g.lock = "vertical";
        return;
      }
      if (Math.abs(dx) > 16 && Math.abs(dx) > Math.abs(dy) * 1.35) {
        g.lock = "horizontal";
      }
    }
    if (g.lock === "horizontal") {
      setDragOffset(Math.max(-44, Math.min(44, dx * 0.35)));
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const g = gestureRef.current;
    gestureRef.current = null;
    setDragOffset(0);
    if (!g || g.edgeSkip || g.lock !== "horizontal") return;
    const t = e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - g.startX;
    if (Math.abs(dx) < 48) return;
    if (dx < 0 && activeIndex < tabs.length - 1) {
      onChange(tabs[activeIndex + 1].id);
    } else if (dx > 0 && activeIndex > 0) {
      onChange(tabs[activeIndex - 1].id);
    }
  };

  return (
    <div className="space-y-3">
      <div
        role="tablist"
        className={cn(
          "relative p-1 rounded-2xl bg-[var(--ms-card)] border border-[var(--ms-border)]",
          equalGrid ? "grid" : "flex items-center gap-1.5 overflow-x-auto ms-no-scrollbar",
          className,
        )}
        style={equalGrid ? { gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` } : undefined}
      >
        {equalGrid && tabs.length > 0 && (
          <div
            aria-hidden="true"
            className="absolute top-1 bottom-1 left-1 rounded-xl bg-[var(--ms-brand-600)] shadow-sm transition-transform duration-200 ease-out pointer-events-none"
            style={{
              width: `calc((100% - 8px) / ${tabs.length})`,
              transform: `translateX(${activeIndex * 100}%)`,
            }}
          />
        )}
        {tabs.map((tab) => {
          const active = tab.id === value;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(tab.id)}
              className={cn(
                "relative z-10 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-[12.5px] font-medium min-h-[40px] transition-colors cursor-pointer",
                !equalGrid && "shrink-0 px-3.5",
                active
                  ? equalGrid
                    ? "text-white font-semibold"
                    : "bg-[var(--ms-brand-600)] text-white font-semibold shadow-sm"
                  : "text-[var(--ms-ink-2)] hover:text-[var(--ms-ink)]",
              )}
            >
              <span className="truncate">{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded-full text-[10px] font-semibold leading-none shrink-0",
                    active ? "bg-white/20 text-white" : "bg-[var(--ms-brand-50)] text-[var(--ms-brand-text)]",
                  )}
                >
                  {tab.badge > 99 ? "99+" : tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {children !== undefined && (
        <div
          className={cn("transition-transform duration-150 ease-out", contentClassName)}
          style={dragOffset ? { transform: `translateX(${dragOffset}px)` } : undefined}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * R6: Compact Filter trigger button with active filter count badge.
 */
export function FilterButton({
  activeCount = 0,
  onClick,
  label = "Filter",
  className,
}: {
  activeCount?: number;
  onClick: () => void;
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "ms-tile h-11 px-3.5 flex items-center gap-1.5 text-[12.5px] font-medium shrink-0 cursor-pointer active:scale-95 transition-transform",
        activeCount > 0
          ? "border-[var(--ms-brand)] text-[var(--ms-brand-text)] bg-[var(--ms-brand-50)]"
          : "text-[var(--ms-ink-2)]",
        className,
      )}
      aria-label={label}
    >
      <SlidersHorizontal className="h-4 w-4 shrink-0" />
      <span>{label}</span>
      {activeCount > 0 && (
        <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--ms-brand-600)] text-white text-[10px] font-semibold flex items-center justify-center leading-none">
          {activeCount}
        </span>
      )}
    </button>
  );
}

/**
 * R6: Removable active filter pills shown ONLY when filters are active.
 */
export function ActiveFilterPills({
  pills,
  onClearAll,
}: {
  pills: Array<{ id: string; label: string; onRemove: () => void }>;
  onClearAll?: () => void;
}) {
  if (pills.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {pills.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={p.onRemove}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--ms-brand-50)] text-[var(--ms-brand-text)] border border-[var(--ms-brand)]/25 text-[11.5px] font-medium cursor-pointer active:scale-95"
        >
          <span>{p.label}</span>
          <X className="h-3 w-3" />
        </button>
      ))}
      {onClearAll && pills.length > 1 && (
        <button
          type="button"
          onClick={onClearAll}
          className="px-2 py-1 text-[11.5px] font-medium text-[var(--ms-ink-3)] underline cursor-pointer"
        >
          Clear all
        </button>
      )}
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
  fullHeight = false,
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  fullHeight?: boolean;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(15,23,32,0.55)]"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          paddingBottom: footer ? undefined : "calc(16px + env(safe-area-inset-bottom, 0px))",
          maxHeight: fullHeight ? "calc(100dvh - 8px)" : "85dvh",
        }}
        className={cn(
          "ms-anim-sheet w-full max-w-lg rounded-t-[24px] bg-[var(--ms-card)] text-[var(--ms-ink)] shadow-2xl flex flex-col overflow-hidden",
          fullHeight && "h-[calc(100dvh-8px)]",
        )}
      >
        {/* Sticky Header */}
        <div className="shrink-0 px-4 pt-3 pb-2.5 border-b border-[var(--ms-divider)]">
          <div className="mx-auto mb-2.5 h-1 w-10 rounded-full bg-[var(--ms-border)]" />
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[16px] font-semibold truncate">{title || ""}</h3>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="h-9 w-9 rounded-xl flex items-center justify-center text-[var(--ms-ink-3)] hover:bg-[var(--ms-page)] cursor-pointer shrink-0"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4">{children}</div>

        {/* Sticky Footer */}
        {footer && (
          <div
            className="shrink-0 px-4 pt-3 border-t border-[var(--ms-divider)] bg-[var(--ms-card)]"
            style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))" }}
          >
            {footer}
          </div>
        )}
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

export type StatusChipTone =
  | "teal"
  | "pending"
  | "success"
  | "error"
  | "info"
  | "review"
  | "premium"
  | "neutral";

export function StatusChip({
  label,
  tone = "teal",
  icon,
  onClick,
}: {
  label: string;
  tone?: StatusChipTone;
  icon?: React.ReactNode;
  onClick?: () => void;
}) {
  const toneClasses: Record<StatusChipTone, string> = {
    teal: "bg-[var(--ms-brand-50)] text-[var(--ms-brand-text)] border-[var(--ms-brand-100)]",
    pending: "bg-[var(--ms-pending-bg)] text-[var(--ms-pending-fg)] border-[var(--ms-pending-border)]",
    success: "bg-[var(--ms-success-bg)] text-[var(--ms-success)] border-[var(--ms-success-border)]",
    error: "bg-[var(--ms-error-bg)] text-[var(--ms-error)] border-[var(--ms-error-border)]",
    info: "bg-[var(--ms-info-bg)] text-[var(--ms-info-fg)] border-[var(--ms-info-border)]",
    review: "bg-[var(--ms-tone-indigo-bg)] text-[var(--ms-tone-indigo-fg)] border-[var(--ms-info-border)]",
    premium: "ms-premium-gradient text-[var(--ms-premium-gold)]",
    neutral: "bg-[var(--ms-page)] text-[var(--ms-ink-3)] border-[var(--ms-border)]",
  };
  const Tag = onClick ? "button" : "span";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 px-2.5 h-6 rounded-full text-[12px] font-medium border shrink-0 whitespace-nowrap",
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
