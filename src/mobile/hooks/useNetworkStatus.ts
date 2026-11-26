import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/use-toast";

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [lastUpdated, setLastUpdated] = useState<string | null>(() => {
    const d = new Date();
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  });
  const wasOfflineRef = useRef(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      const d = new Date();
      setLastUpdated(d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
      if (wasOfflineRef.current) {
        wasOfflineRef.current = false;
        toast({
          title: "Back online",
          description: "Refreshing your latest property data.",
        });
        void queryClient.refetchQueries({ type: "active" });
      }
    };

    const handleOffline = () => {
      wasOfflineRef.current = true;
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    let capCleanup: (() => void) | null = null;
    const capNet = (window as any).Capacitor?.Plugins?.Network;
    if (capNet) {
      void capNet.getStatus().then((status: { connected: boolean }) => {
        if (!status.connected) handleOffline();
      }).catch(() => {});

      const listener = capNet.addListener("networkStatusChange", (status: { connected: boolean }) => {
        if (status.connected) handleOnline();
        else handleOffline();
      });
      capCleanup = () => {
        void listener?.then?.((h: { remove: () => void }) => h.remove());
      };
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      capCleanup?.();
    };
  }, [queryClient]);

  return { isOnline, isOffline: !isOnline, lastUpdated };
}
