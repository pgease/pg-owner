import * as React from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "default" | "destructive" | "error" | "success" | "warning" | "info";

export interface ToastItem {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastCardProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

export const ToastCard: React.FC<ToastCardProps> = ({ toast, onDismiss }) => {
  const [touchStart, setTouchStart] = React.useState<number | null>(null);
  const [touchDelta, setTouchDelta] = React.useState<number>(0);
  const [isClosing, setIsClosing] = React.useState(false);

  const variant = toast.variant === "destructive" ? "error" : toast.variant || "default";

  const handleClose = React.useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onDismiss(toast.id);
    }, 200);
  }, [toast.id, onDismiss]);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const delta = e.touches[0].clientY - touchStart;
    if (delta > 0) {
      setTouchDelta(delta);
    }
  };

  const onTouchEnd = () => {
    if (touchDelta > 50) {
      handleClose();
    } else {
      setTouchDelta(0);
      setTouchStart(null);
    }
  };

  // Border & Icon mapping
  let borderLeftColor = "border-l-[#008080]";
  let iconComponent = <CheckCircle2 className="h-5 w-5 text-[#008080] shrink-0" />;
  let cardBg = "bg-white";

  if (variant === "error") {
    borderLeftColor = "border-l-[#DC2626]";
    iconComponent = <AlertCircle className="h-5 w-5 text-[#DC2626] shrink-0" />;
    cardBg = "bg-[#FEF2F2]/60";
  } else if (variant === "warning") {
    // Brand requirement: Amber is NOT allowed. Dark teal #005F5F with info icon.
    borderLeftColor = "border-l-[#005F5F]";
    iconComponent = <Info className="h-5 w-5 text-[#005F5F] shrink-0" />;
    cardBg = "bg-[#E6F3F3]/50";
  } else if (variant === "info" || variant === "default") {
    borderLeftColor = "border-l-[#008080]";
    iconComponent = <Info className="h-5 w-5 text-[#008080] shrink-0" />;
    cardBg = "bg-white";
  } else if (variant === "success") {
    borderLeftColor = "border-l-[#008080]";
    iconComponent = <CheckCircle2 className="h-5 w-5 text-[#008080] shrink-0" />;
    cardBg = "bg-white";
  }

  const isAssertive = variant === "error";

  return (
    <div
      role="status"
      aria-live={isAssertive ? "assertive" : "polite"}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{
        transform: `translateY(${touchDelta}px)`,
        opacity: isClosing ? 0 : 1,
        transition: isClosing ? "opacity 200ms ease, transform 200ms ease" : "transform 100ms ease-out",
      }}
      className={cn(
        "pointer-events-auto relative flex w-full max-w-[92%] sm:max-w-[440px] items-start gap-3 rounded-[12px] border border-gray-100 p-[14px] shadow-lg backdrop-blur-sm transition-all duration-200 border-l-4",
        borderLeftColor,
        cardBg,
        !isClosing && "animate-in fade-in-0 slide-in-from-bottom-5 duration-200"
      )}
    >
      <div className="mt-0.5">{iconComponent}</div>

      <div className="flex-1 min-w-0 pr-2">
        {toast.title && (
          <h5 className="font-semibold text-sm text-[#1F2937] leading-snug truncate">
            {toast.title}
          </h5>
        )}
        {toast.description && (
          <p className="text-[13px] text-[#1F2937]/70 font-normal leading-relaxed mt-0.5 break-words">
            {toast.description}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={handleClose}
        className="shrink-0 p-1 rounded-md text-gray-400 hover:text-gray-600 active:bg-gray-100 transition-colors"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
