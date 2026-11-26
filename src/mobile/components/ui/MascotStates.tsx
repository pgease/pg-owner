import React from "react";
import { CloudOff, RefreshCw } from "lucide-react";
import mascotEmpty512 from "@/assets/mascot/pgease-mascot-empty-512.webp";
import mascotError512 from "@/assets/mascot/pgease-mascot-error-512.webp";
import mascotOffline512 from "@/assets/mascot/pgease-mascot-offline-512.webp";
import { PrimaryButton } from "./Primitives";
import { cn } from "@/lib/utils";

const MASCOT_BY_VARIANT = {
  empty: mascotEmpty512,
  error: mascotError512,
  offline: mascotOffline512,
} as const;

export function MascotEmptyState({
  variant = "empty",
  title,
  message,
  actionLabel,
  onAction,
  size = "lg",
  className,
}: {
  variant?: "empty" | "offline" | "error";
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  size?: "lg" | "md" | "sm";
  className?: string;
}) {
  const circleSizes = {
    lg: "w-[220px] h-[220px]",
    md: "w-[160px] h-[160px]",
    sm: "w-[104px] h-[104px]",
  }[size];

  const artSizes = {
    lg: "w-[188px] h-[188px]",
    md: "w-[136px] h-[136px]",
    sm: "w-[86px] h-[86px]",
  }[size];

  return (
    <div className={cn("flex flex-col items-center justify-center text-center px-6 py-8", className)}>
      <div
        className={cn(
          "rounded-full bg-[var(--ms-mascot-circle)] flex items-center justify-center mb-5 shrink-0",
          circleSizes,
        )}
      >
        <img
          src={MASCOT_BY_VARIANT[variant]}
          alt={title}
          className={cn("object-contain select-none", artSizes)}
        />
      </div>
      <h3 className="text-[18px] font-semibold text-[var(--ms-ink)]">{title}</h3>
      <p className="text-[13px] text-[var(--ms-ink-2)] mt-1.5 max-w-[280px] leading-relaxed">{message}</p>
      {actionLabel && onAction && (
        <PrimaryButton type="button" onClick={onAction} className="mt-5 px-6">
          {actionLabel}
        </PrimaryButton>
      )}
    </div>
  );
}

export function MascotErrorState({
  title = "Something went wrong",
  message = "We couldn't load this right now. Please try again in a moment.",
  onRetry,
  retrying,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  return (
    <MascotEmptyState
      variant="error"
      size="md"
      title={title}
      message={message}
      actionLabel={retrying ? "Retrying..." : "Try again"}
      onAction={onRetry}
    />
  );
}

export function OfflineBanner({
  lastUpdated,
  onRetry,
  retrying,
}: {
  lastUpdated?: string | null;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="ms-anim-sheet mx-4 mt-3 rounded-xl bg-[var(--ms-brand-50)] border border-[var(--ms-brand-100)] border-l-4 border-l-[var(--ms-brand-800)] px-3.5 py-2.5 flex items-center justify-between gap-2.5"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <CloudOff className="h-4 w-4 text-[var(--ms-brand-800)] dark:text-[var(--ms-brand-text)] shrink-0" />
        <div className="min-w-0">
          <div className="text-[12px] font-semibold text-[var(--ms-ink)] truncate">
            You&apos;re offline — showing last saved data
          </div>
          {lastUpdated && (
            <div className="text-[11px] text-[var(--ms-ink-3)] truncate">Last updated {lastUpdated}</div>
          )}
        </div>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--ms-brand-600)] text-[var(--ms-brand-text)] bg-[var(--ms-card)] text-[11px] font-semibold min-h-[32px] cursor-pointer"
        >
          <RefreshCw className={cn("h-3 w-3", retrying && "animate-spin")} />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
}
