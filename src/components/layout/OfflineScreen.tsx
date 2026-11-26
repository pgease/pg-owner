import { useEffect, useState } from "react";
import { authStorage } from "@/api/http";
import pgeaseLogo from "@/assets/pgease-icon-color.png";
import { MascotEmptyState } from "@/mobile/components/ui/MascotStates";

/**
 * Full-screen branded offline gate ONLY for cold starts when the user has
 * no cached authenticated shell (not logged in) and zero connectivity.
 * Logged-in users stay inside the cached shell with the non-blocking OfflineBanner.
 */
export function OfflineScreen() {
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);

    const capNet = (window as any).Capacitor?.Plugins?.Network;
    const listener = capNet?.addListener?.("networkStatusChange", (s: { connected: boolean }) => {
      setOnline(s.connected);
    });

    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
      void listener?.then?.((h: { remove: () => void }) => h.remove());
    };
  }, []);

  if (online || authStorage.isLoggedIn()) return null;

  const handleRetry = async () => {
    setChecking(true);
    try {
      await fetch("/", { method: "HEAD", cache: "no-store" });
      setOnline(true);
      window.location.reload();
    } catch {
      setOnline(navigator.onLine);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="ms-shell fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[var(--ms-card)] px-6 text-center">
      <div className="flex items-center gap-2 mb-4">
        <img src={pgeaseLogo} alt="PG Ease" className="h-8 w-8 rounded-lg" />
        <span className="text-[18px] font-semibold text-[var(--ms-ink)]">PG Ease</span>
      </div>
      <MascotEmptyState
        variant="offline"
        size="lg"
        title="You're offline"
        message="Please check your Wi-Fi or mobile data. Your saved data is safe, and we'll reconnect as soon as you're back online."
        actionLabel={checking ? "Checking..." : "Try again"}
        onAction={() => void handleRetry()}
      />
      <div className="flex items-center gap-2 text-[12px] text-[var(--ms-ink-3)] mt-2">
        <span className="h-2 w-2 rounded-full bg-[var(--ms-brand-600)] animate-pulse" />
        <span>Waiting for connection…</span>
      </div>
    </div>
  );
}
