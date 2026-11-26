import { describe, expect, it } from "vitest";
import { formatCount, formatINR } from "../formatters";

describe("formatINR", () => {
  it("formats basic integers with Indian grouping", () => {
    expect(formatINR(0)).toBe("₹0");
    expect(formatINR(999)).toBe("₹999");
    expect(formatINR(1000)).toBe("₹1,000");
    expect(formatINR(12345)).toBe("₹12,345");
    expect(formatINR(500169)).toBe("₹5,00,169");
    expect(formatINR(1e7)).toBe("₹1,00,00,000");
  });

  it("preserves paise only when decimals exist", () => {
    expect(formatINR(50016.9)).toBe("₹50,016.90");
    expect(formatINR(12500.0)).toBe("₹12,500");
  });

  it("handles negative, null, undefined, and string inputs safely", () => {
    expect(formatINR(-1500)).toBe("-₹1,500");
    expect(formatINR(null)).toBe("₹0");
    expect(formatINR(undefined)).toBe("₹0");
    expect(formatINR("500169")).toBe("₹5,00,169");
    expect(formatINR("₹1,23,456")).toBe("₹1,23,456");
    expect(formatINR("not-a-number")).toBe("₹0");
  });

  it("formats compact values with uppercase K, L, Cr and clean decimals", () => {
    expect(formatINR(0, { compact: true })).toBe("₹0");
    expect(formatINR(999, { compact: true })).toBe("₹999");
    expect(formatINR(1000, { compact: true })).toBe("₹1K");
    expect(formatINR(12400, { compact: true })).toBe("₹12.4K");
    expect(formatINR(50016.9, { compact: true })).toBe("₹50K");
    expect(formatINR(500169, { compact: true })).toBe("₹5.0L");
    expect(formatINR(1e7, { compact: true })).toBe("₹1.0Cr");
    expect(formatINR(-500000, { compact: true })).toBe("-₹5.0L");
  });
});

describe("formatCount", () => {
  it("formats counts safely", () => {
    expect(formatCount(0)).toBe("0");
    expect(formatCount(123456)).toBe("1,23,456");
    expect(formatCount(null)).toBe("0");
    expect(formatCount("42")).toBe("42");
  });
});
