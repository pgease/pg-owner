import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, ArrowRight, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEntitlements } from "@/hooks/useEntitlements";
import { cn } from "@/lib/utils";

const TRIAL_DISMISS_KEY = "pgease_dismissed_trial_banner";

function readDismissed(key: string): boolean {
  try {
    return sessionStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}

function writeDismissed(key: string) {
  try {
    sessionStorage.setItem(key, "true");
  } catch {
    // ignore
  }
}

/**
 * Plan-state strip under the header.
 * - Expired: persistent, explains data is safe, one clear CTA.
 * - Trial: dismissible per session, only shown when ≤ 10 days remain (otherwise the header chip is enough).
 * - Lite: no banner — the plan is visible in the header chip; upselling here is noise.
 */
export const SubscriptionBanner: React.FC = () => {
  const navigate = useNavigate();
  const { daysRemaining, isTrial, isExpired, isLoading } = useEntitlements();
  const [dismissedTrial, setDismissedTrial] = useState(() => readDismissed(TRIAL_DISMISS_KEY));

  if (isLoading) return null;

  if (isExpired) {
    return (
      <Strip tone="danger" role="alert">
        <Lock className="h-4 w-4 shrink-0 text-rose-600" aria-hidden />
        <div className="min-w-0 flex-1 flex items-center justify-between gap-2">
          <p className="min-w-0 truncate text-xs sm:text-sm">
            <span className="font-semibold text-rose-700 dark:text-rose-400">Plan expired</span>
            <span className="hidden sm:inline text-muted-foreground"> — Your data is safe. Renew to add tenants & record payments.</span>
          </p>
          <Button size="sm" className="h-7 sm:h-8 px-2.5 sm:px-3 text-xs shrink-0 gap-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold" onClick={() => navigate("/plans")}>
            <span>Renew</span> <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </Strip>
    );
  }

  if (isTrial && !dismissedTrial && daysRemaining <= 10) {
    return (
      <Strip tone="warning">
        <Clock className="h-4 w-4 shrink-0 text-amber-600" aria-hidden />
        <div className="min-w-0 flex-1 flex items-center justify-between gap-2">
          <p className="min-w-0 truncate text-xs sm:text-sm">
            <span className="font-semibold text-amber-800 dark:text-amber-300">
              {daysRemaining <= 0 ? "Trial ends today" : `Trial: ${daysRemaining}d left`}
            </span>
            <span className="hidden sm:inline text-muted-foreground"> — Pick a plan to keep operations uninterrupted.</span>
          </p>
          <div className="flex items-center gap-1 shrink-0">
            <Button size="sm" variant="outline" className="h-7 sm:h-8 px-2.5 text-xs gap-1 border-amber-300 hover:bg-amber-100" onClick={() => navigate("/plans")}>
              <span>Plans</span> <ArrowRight className="h-3 w-3" />
            </Button>
            <button
              type="button"
              onClick={() => {
                setDismissedTrial(true);
                writeDismissed(TRIAL_DISMISS_KEY);
              }}
              className="rounded p-1 text-muted-foreground hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </Strip>
    );
  }

  return null;
};

function Strip({
  tone,
  children,
  role,
}: {
  tone: "danger" | "warning";
  children: React.ReactNode;
  role?: React.AriaRole;
}) {
  return (
    <div
      role={role}
      className={cn(
        "border-b px-3 py-2 sm:px-5",
        tone === "danger" ? "border-destructive/20 bg-destructive/5 text-foreground" : "border-warning/30 bg-warning/10 text-foreground",
      )}
    >
      <div className={cn("flex items-center gap-3", tone === "danger" ? "[&>svg]:text-destructive" : "[&>svg]:text-amber-700 dark:[&>svg]:text-amber-300")}>
        {children}
      </div>
    </div>
  );
}
