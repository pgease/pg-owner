import React, { useState } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { OfflineBanner } from "./MascotStates";

export function PageScaffold({
  header,
  children,
  onRefresh,
  isOffline,
  lastUpdated,
  className,
}: {
  header?: React.ReactNode;
  children: React.ReactNode;
  onRefresh?: () => Promise<void> | void;
  isOffline?: boolean;
  lastUpdated?: string | null;
  className?: string;
}) {
  const [refreshing, setRefreshing] = useState(false);

  const triggerRefresh = async () => {
    if (!onRefresh || refreshing) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className={cn("ms-shell ms-chrome-no-select min-h-full pb-[calc(88px+env(safe-area-inset-bottom,0px))]", className)}>
      {header}
      {isOffline && (
        <OfflineBanner lastUpdated={lastUpdated} onRetry={triggerRefresh} retrying={refreshing} />
      )}
      {refreshing && (
        <div className="flex items-center justify-center py-2 text-[12px] text-[var(--ms-brand-text)] gap-1.5">
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          <span>Refreshing...</span>
        </div>
      )}
      <div className="ms-anim-tab">{children}</div>
    </div>
  );
}
