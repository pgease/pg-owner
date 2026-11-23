import { useEffect, useRef } from "react";

/**
 * Push a history entry while an overlay is open so the Android back button
 * closes it instead of leaving the screen. The entry is removed when the
 * overlay closes from the UI.
 */
export function useOverlayHistory(enabled: boolean, onBack: () => void) {
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  useEffect(() => {
    if (!enabled) return;
    const previous = window.history.state;
    const nextCount = Number(previous?.pgeaseOverlay || 0) + 1;
    window.history.pushState({ ...(previous || {}), pgeaseOverlay: nextCount }, "");
    let closedByPop = false;
    const onPop = () => {
      closedByPop = true;
      onBackRef.current();
    };
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      if (!closedByPop && window.history.state?.pgeaseOverlay) {
        window.history.back();
      }
    };
  }, [enabled]);
}
