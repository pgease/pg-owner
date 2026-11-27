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

  // Semantic WCAG AA contrast mapping (4.5:1+ for text)
  let borderLeftColor = "border-[#166534]";
  let iconComponent = <CheckCircle2 className="h-5 w-5 text-white shrink-0" />;
  let cardBg = "bg-[#15803D]";
  let titleColor = "text-white";
  let descColor = "text-white/95";
  let closeColor = "text-white/85 hover:text-white active:bg-white/15";

  if (variant === "error") {
    borderLeftColor = "border-[#B91C1C]";
    iconComponent = <AlertCircle className="h-5 w-5 text-white shrink-0" />;
    cardBg = "bg-[#DC2626]";
  } else if (variant === "warning") {
    borderLeftColor = "border-[#D97706]";
    iconComponent = <Info className="h-5 w-5 text-[#111827] shrink-0" />;
    cardBg = "bg-[#F59E0B]";
    titleColor = "text-[#111827]";
    descColor = "text-[#111827]/90";
    closeColor = "text-[#111827]/80 hover:text-[#111827] active:bg-black/10";
  } else if (variant === "info" || variant === "default") {
    borderLeftColor = "border-[#1E40AF]";
    iconComponent = <Info className="h-5 w-5 text-white shrink-0" />;
    cardBg = "bg-[#1D4ED8]";
  } else if (variant === "success") {
    borderLeftColor = "border-[#166534]";
    iconComponent = <CheckCircle2 className="h-5 w-5 text-white shrink-0" />;
    cardBg = "bg-[#15803D]";
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
        "pointer-events-auto relative flex w-full max-w-[92%] sm:max-w-[440px] items-start gap-3 rounded-[12px] border p-[14px] shadow-lg transition-all duration-200",
        borderLeftColor,
        cardBg,
        !isClosing && "animate-in fade-in-0 slide-in-from-bottom-5 duration-200"
      )}
    >
      <div className="mt-0.5">{iconComponent}</div>

      <div className="flex-1 min-w-0 pr-2">
        {toast.title && (
          <h5 className={cn("font-semibold text-sm leading-snug truncate", titleColor)}>
            {toast.title}
          </h5>
        )}
        {toast.description && (
          <p className={cn("text-[13px] font-normal leading-relaxed mt-0.5 break-words", descColor)}>
            {toast.description}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={handleClose}
        className={cn("shrink-0 p-1 rounded-md transition-colors", closeColor)}
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
