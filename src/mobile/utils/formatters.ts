export interface FormatINROptions {
  compact?: boolean;
}

function toFiniteNumber(input: unknown): number | null {
  if (input === null || input === undefined) return null;
  if (typeof input === "number") return Number.isFinite(input) ? input : null;
  if (typeof input === "string") {
    const cleaned = input.replace(/[₹,\s]/g, "").trim();
    if (!cleaned) return null;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/**
 * Formats an amount in Indian Rupees (INR) using Intl.NumberFormat('en-IN').
 * - Full mode: ₹5,00,169 | ₹12,500 | ₹0 | ₹50,016.90 (only shows decimals if paise exist)
 * - Compact mode: ₹1.2Cr | ₹5.0L | ₹12.4K | ₹1K (uppercase units, trim .0 only for K)
 * - Safe for null, undefined, NaN, negative, and numeric strings.
 */
export function formatINR(amount: unknown, options: FormatINROptions = {}): string {
  const num = toFiniteNumber(amount);
  if (num === null) return "₹0";

  const isNeg = num < 0;
  const abs = Math.abs(num);
  const sign = isNeg ? "-" : "";

  if (options.compact) {
    if (abs >= 1_00_00_000) {
      return `${sign}₹${(abs / 1_00_00_000).toFixed(1)}Cr`;
    }
    if (abs >= 1_00_000) {
      return `${sign}₹${(abs / 1_00_000).toFixed(1)}L`;
    }
    if (abs >= 1_000) {
      const kVal = (abs / 1_000).toFixed(1).replace(/\.0$/, "");
      return `${sign}₹${kVal}K`;
    }
    const hasPaise = Math.round(abs * 100) % 100 !== 0;
    return `${sign}${new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: hasPaise ? 2 : 0,
      maximumFractionDigits: hasPaise ? 2 : 0,
    }).format(abs)}`;
  }

  const hasPaise = Math.round(abs * 100) % 100 !== 0;
  return `${sign}${new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: hasPaise ? 2 : 0,
  }).format(abs)}`;
}

/**
 * Formats a count using Indian grouping (e.g. 1,234). Safe for invalid inputs.
 */
export function formatCount(n: unknown): string {
  const num = toFiniteNumber(n);
  if (num === null) return "0";
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(Math.round(num));
}
