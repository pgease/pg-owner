import React, { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ToastCard } from "./toast";

export function Toaster() {
  const { toasts, dismiss } = useToast();
  const [keyboardOffset, setKeyboardOffset] = useState<number>(0);

  useEffect(() => {
    // 1. VisualViewport listener (tracks keyboard on mobile browsers & WebViews)
    const handleViewportChange = () => {
      if (window.visualViewport) {
        const layoutHeight = window.innerHeight;
        const visibleHeight = window.visualViewport.height;
        const diff = layoutHeight - visibleHeight;
        if (diff > 120) {
          // Keyboard is up
          setKeyboardOffset(diff);
        } else {
          setKeyboardOffset(0);
        }
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleViewportChange);
      window.visualViewport.addEventListener("scroll", handleViewportChange);
    }

    // 2. Capacitor Keyboard events if running native
    const keyboardPlugin = (window as any).Capacitor?.Plugins?.Keyboard;
    let kbShowHandle: any = null;
    let kbHideHandle: any = null;

    if (keyboardPlugin?.addListener) {
      try {
        kbShowHandle = keyboardPlugin.addListener("keyboardWillShow", (info: { keyboardHeight: number }) => {
          if (info?.keyboardHeight) {
            setKeyboardOffset(info.keyboardHeight);
          }
        });
        kbHideHandle = keyboardPlugin.addListener("keyboardWillHide", () => {
          setKeyboardOffset(0);
        });
      } catch {
        /* ignore */
      }
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleViewportChange);
        window.visualViewport.removeEventListener("scroll", handleViewportChange);
      }
      if (kbShowHandle?.remove) kbShowHandle.remove();
      if (kbHideHandle?.remove) kbHideHandle.remove();
    };
  }, []);

  if (!toasts.length) return null;

  // Bottom offset calculation:
  // When keyboard is open: above keyboard + 12px
  // When keyboard is closed: above safe area (or bottom nav)
  const bottomStyle = keyboardOffset > 0
    ? `${keyboardOffset + 14}px`
    : `calc(env(safe-area-inset-bottom, 0px) + 20px)`;

  return (
    <div
      style={{ bottom: bottomStyle }}
      className="fixed left-0 right-0 z-[99999] pointer-events-none flex justify-center items-center px-3 transition-all duration-200"
    >
      {toasts.map((item) => (
        <ToastCard key={item.id} toast={item} onDismiss={dismiss} />
      ))}
    </div>
  );
}
