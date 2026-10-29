import { type ReactNode } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileSearch({
  value,
  onChange,
  placeholder,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  "aria-label"?: string;
}) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9E9E9E]" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel || placeholder}
        className="h-12 w-full rounded-2xl border border-[#E5E5E5] bg-white pl-10 pr-3 text-[16px] text-[#101010] placeholder:text-[#9E9E9E] outline-none focus:border-[#008080]"
      />
    </div>
  );
}

export function MobileChips({
  items,
  value,
  onChange,
}: {
  items: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={cn(
              "h-11 shrink-0 rounded-full px-4 text-[14px] font-medium",
              active ? "bg-[#008080] text-white" : "bg-[#F5F5F5] text-[#101010]",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export function MobileCard({
  children,
  onClick,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "w-full rounded-[16px] bg-white p-3.5 text-left !h-auto !min-h-0",
        className,
      )}
    >
      {children}
    </Comp>
  );
}

export function MobileFab({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed z-30 flex h-14 items-center gap-2 rounded-full bg-[#008080] px-5 text-[15px] font-medium text-white shadow-[0_8px_24px_rgba(0,128,128,0.35)] md:hidden"
      style={{ bottom: "calc(72px + var(--safe-bottom) + 12px)", right: "16px" }}
    >
      {label}
    </button>
  );
}

export function MobileEmpty({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-[16px] bg-white px-4 py-10 text-center">
      <p className="text-[16px] font-semibold text-[#101010]">{title}</p>
      {description ? <p className="mt-1 text-[13px] text-[#636363]">{description}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
