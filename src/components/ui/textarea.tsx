import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  showCount?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      maxLength = 254,
      showCount = true,
      value,
      defaultValue,
      onChange,
      onPaste,
      ...props
    },
    ref,
  ) => {
    // Default 254 characters for reason / description / remarks / notes / messages
    const effectiveMaxLength = maxLength !== undefined ? maxLength : 254;

    const [currentVal, setCurrentVal] = React.useState<string>(() => {
      if (typeof value === "string") return value;
      if (typeof defaultValue === "string") return defaultValue;
      return "";
    });

    React.useEffect(() => {
      if (value !== undefined) {
        setCurrentVal(typeof value === "string" ? value : String(value ?? ""));
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCurrentVal(e.target.value);
      onChange?.(e);
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      if (effectiveMaxLength !== undefined) {
        const text = e.clipboardData.getData("text");
        const target = e.currentTarget;
        const start = target.selectionStart ?? 0;
        const end = target.selectionEnd ?? 0;
        const selectedLength = end - start;
        const remainingSpace =
          effectiveMaxLength - (target.value.length - selectedLength);

        if (text.length > remainingSpace) {
          e.preventDefault();
          const truncated = text.slice(0, Math.max(0, remainingSpace));
          const newValue =
            target.value.slice(0, start) + truncated + target.value.slice(end);

          const nativeSetter = Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype,
            "value",
          )?.set;
          nativeSetter?.call(target, newValue);
          target.dispatchEvent(new Event("input", { bubbles: true }));
          setCurrentVal(newValue);
        }
      }
      onPaste?.(e);
    };

    const charCount = currentVal.length;
    const isAtLimit =
      effectiveMaxLength !== undefined && charCount >= effectiveMaxLength;

    return (
      <div className="relative w-full">
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-[#C8CFD6] bg-white px-3 py-2 text-sm text-[#18212B] ring-offset-background placeholder:text-[#98A2AE] focus-visible:outline-none focus-visible:border-[#008080] focus-visible:ring-[3px] focus-visible:ring-[rgba(0,128,128,0.25)] disabled:cursor-not-allowed disabled:bg-[#EEF1F3] disabled:text-[#98A2AE]",
            className,
          )}
          ref={ref}
          maxLength={effectiveMaxLength}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          onPaste={handlePaste}
          {...props}
        />
        {showCount && effectiveMaxLength !== undefined && (
          <div className="flex justify-end mt-1">
            <span
              className={cn(
                "text-[11px] tabular-nums transition-colors",
                isAtLimit
                  ? "text-red-500 font-semibold"
                  : "text-gray-400 font-normal",
              )}
            >
              {charCount}/{effectiveMaxLength}
            </span>
          </div>
        )}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
