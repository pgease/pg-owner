import React from "react";

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
] as const;

export interface StructuredAddressValue {
  line1: string;
  line2: string;
  city: string;
  state: string;
  pin: string;
}

export interface SplitAddressResult extends StructuredAddressValue {
  pinConflict: boolean;
}

const PIN_RE = /\b([1-9]\d{5})\b/;

export function splitLegacyAddress(rawAddress?: string | null, pinField?: string | null): SplitAddressResult {
  const raw = String(rawAddress ?? "").trim();
  const cleanPinField = String(pinField ?? "").replace(/\D/g, "").slice(0, 6);
  const embeddedPinMatch = raw.match(PIN_RE);
  const embeddedPin = embeddedPinMatch?.[1] ?? "";
  const pin = cleanPinField.length === 6 ? cleanPinField : embeddedPin;
  const pinConflict = Boolean(cleanPinField.length === 6 && embeddedPin && cleanPinField !== embeddedPin);

  if (!raw) {
    return { line1: "", line2: "", city: "", state: "", pin, pinConflict };
  }

  let parts = raw
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length > 0 && /^india$/i.test(parts[parts.length - 1])) {
    parts.pop();
  }

  // Strip embedded PIN tokens from trailing parts
  parts = parts
    .map((p) => p.replace(PIN_RE, "").trim())
    .filter(Boolean);

  let state = "";
  const stateIdx = parts.findIndex((p) =>
    INDIAN_STATES.some((s) => s.toLowerCase() === p.toLowerCase()),
  );
  if (stateIdx >= 0) {
    const matched = INDIAN_STATES.find((s) => s.toLowerCase() === parts[stateIdx].toLowerCase());
    state = matched || parts[stateIdx];
    parts.splice(stateIdx, 1);
  }

  let city = "";
  if (parts.length >= 2) {
    city = parts.pop() || "";
  }

  const remaining = parts.join(", ");
  let line1 = remaining;
  let line2 = "";
  if (remaining.length > 100) {
    line1 = remaining.slice(0, 100).trim();
    line2 = remaining.slice(100, 200).trim();
  }

  return {
    line1: line1.slice(0, 100),
    line2: line2.slice(0, 100),
    city: city.slice(0, 100),
    state,
    pin,
    pinConflict,
  };
}

export function composeStructuredAddress(v: StructuredAddressValue): string {
  return [v.line1.trim(), v.line2.trim(), v.city.trim(), v.state.trim(), v.pin.trim(), "India"]
    .filter(Boolean)
    .join(", ");
}

export function isValidIndianPin(pin: string): boolean {
  return /^[1-9]\d{5}$/.test(pin.trim());
}

export function AddressFields({
  value,
  onChange,
  pinConflictHint,
  errors,
}: {
  value: StructuredAddressValue;
  onChange: (next: StructuredAddressValue) => void;
  pinConflictHint?: boolean;
  errors?: Partial<Record<keyof StructuredAddressValue, string>>;
}) {
  const update = (key: keyof StructuredAddressValue, val: string) =>
    onChange({ ...value, [key]: val });

  return (
    <div className="space-y-3">
      {pinConflictHint && (
        <div className="rounded-xl border border-[var(--ms-pending-border)] bg-[var(--ms-pending-bg)] px-3 py-2 text-[12px] text-[var(--ms-pending-fg)]">
          Please check your address — the legacy address text had a different PIN than your saved PIN code.
        </div>
      )}

      <div>
        <div className="flex items-center justify-between">
          <label className="text-[12px] font-medium text-[var(--ms-ink-2)]">Address Line 1 *</label>
          <span className="text-[11px] text-[var(--ms-ink-3)] tabular-nums">{value.line1.length}/100</span>
        </div>
        <input
          type="text"
          maxLength={100}
          placeholder="House / Building / Street"
          value={value.line1}
          onChange={(e) => update("line1", e.target.value.slice(0, 100))}
          className="mt-1 w-full h-11 rounded-xl border border-[var(--ms-border)] bg-[var(--ms-page)] px-3 text-[14px] text-[var(--ms-ink)]"
        />
        {errors?.line1 && <p className="mt-1 text-[11px] text-[var(--ms-error)]">{errors.line1}</p>}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="text-[12px] font-medium text-[var(--ms-ink-2)]">Address Line 2 (Optional)</label>
          <span className="text-[11px] text-[var(--ms-ink-3)] tabular-nums">{value.line2.length}/100</span>
        </div>
        <input
          type="text"
          maxLength={100}
          placeholder="Locality / Landmark"
          value={value.line2}
          onChange={(e) => update("line2", e.target.value.slice(0, 100))}
          className="mt-1 w-full h-11 rounded-xl border border-[var(--ms-border)] bg-[var(--ms-page)] px-3 text-[14px] text-[var(--ms-ink)]"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="flex items-center justify-between">
            <label className="text-[12px] font-medium text-[var(--ms-ink-2)]">City *</label>
            <span className="text-[11px] text-[var(--ms-ink-3)] tabular-nums">{value.city.length}/100</span>
          </div>
          <input
            type="text"
            maxLength={100}
            placeholder="e.g. Ghaziabad"
            value={value.city}
            onChange={(e) => update("city", e.target.value.slice(0, 100))}
            className="mt-1 w-full h-11 rounded-xl border border-[var(--ms-border)] bg-[var(--ms-page)] px-3 text-[14px] text-[var(--ms-ink)]"
          />
          {errors?.city && <p className="mt-1 text-[11px] text-[var(--ms-error)]">{errors.city}</p>}
        </div>

        <div>
          <label className="text-[12px] font-medium text-[var(--ms-ink-2)]">PIN Code *</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="6-digit PIN"
            value={value.pin}
            onChange={(e) => update("pin", e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="mt-1 w-full h-11 rounded-xl border border-[var(--ms-border)] bg-[var(--ms-page)] px-3 text-[14px] text-[var(--ms-ink)] tabular-nums"
          />
          {errors?.pin && <p className="mt-1 text-[11px] text-[var(--ms-error)]">{errors.pin}</p>}
        </div>
      </div>

      <div>
        <label className="text-[12px] font-medium text-[var(--ms-ink-2)]">State *</label>
        <select
          value={value.state}
          onChange={(e) => update("state", e.target.value)}
          className="mt-1 w-full h-11 rounded-xl border border-[var(--ms-border)] bg-[var(--ms-page)] px-3 text-[14px] text-[var(--ms-ink)]"
        >
          <option value="">Select State / UT</option>
          {INDIAN_STATES.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
        {errors?.state && <p className="mt-1 text-[11px] text-[var(--ms-error)]">{errors.state}</p>}
      </div>
    </div>
  );
}
