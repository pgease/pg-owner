import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  sizeVariant?: "default" | "filter";
  showCount?: boolean;
}

const TEXT_LIKE_TYPES = new Set([
  "",
  "text",
  "search",
  "email",
  "url",
  "tel",
  "password",
]);

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      sizeVariant = "default",
      maxLength,
      showCount = false,
      value,
      defaultValue,
      onChange,
      onPaste,
      ...props
    },
    ref,
  ) => {
    // Default 100 characters for all single-line text fields unless explicitly overridden
    const isTextLike = TEXT_LIKE_TYPES.has(type || "");
    const effectiveMaxLength =
      maxLength !== undefined ? maxLength : isTextLike ? 100 : undefined;

    // Track current character length for live counter
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setCurrentVal(e.target.value);
      onChange?.(e);
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
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
            window.HTMLInputElement.prototype,
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

    const inputNode = (
      <input
        type={type}
        maxLength={effectiveMaxLength}
        className={cn(
          "flex w-full rounded-[6px] border border-[#C8CFD6] bg-white px-3 text-[14px] leading-[20px] text-[#18212B] transition-colors placeholder:text-[#98A2AE] hover:border-[#98A2AE] focus-visible:outline-none focus-visible:border-[#008080] focus-visible:ring-[3px] focus-visible:ring-[rgba(0,128,128,0.25)] disabled:cursor-not-allowed disabled:bg-[#EEF1F3] disabled:text-[#98A2AE] file:border-0 file:bg-transparent file:text-sm file:font-medium",
          sizeVariant === "filter" ? "h-[36px]" : "h-[40px]",
          className,
        )}
        ref={ref}
        value={value}
        defaultValue={defaultValue}
        onChange={handleChange}
        onPaste={handlePaste}
        {...props}
      />
    );

    if (showCount && effectiveMaxLength !== undefined) {
      return (
        <div className="relative w-full">
          {inputNode}
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
        </div>
      );
    }

    return inputNode;
  },
);
Input.displayName = "Input";

export { Input };
