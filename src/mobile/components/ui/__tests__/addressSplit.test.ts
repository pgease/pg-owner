import { describe, expect, it } from "vitest";
import { composeStructuredAddress, isValidIndianPin, splitLegacyAddress } from "../AddressFields";

describe("splitLegacyAddress", () => {
  it("splits Shivam 6 pg legacy address and detects PIN conflict", () => {
    const res = splitLegacyAddress(
      "Shipra Sun City, Ghaziabad, Uttar Pradesh, 201001, India",
      "201014",
    );
    expect(res.line1).toBe("Shipra Sun City");
    expect(res.city).toBe("Ghaziabad");
    expect(res.state).toBe("Uttar Pradesh");
    expect(res.pin).toBe("201014");
    expect(res.pinConflict).toBe(true);
  });

  it("extracts PIN from address when pinField is empty", () => {
    const res = splitLegacyAddress("Sector 62, Noida, Uttar Pradesh, 201309, India", "");
    expect(res.pin).toBe("201309");
    expect(res.city).toBe("Noida");
    expect(res.state).toBe("Uttar Pradesh");
    expect(res.pinConflict).toBe(false);
  });

  it("handles Delhi NCT address", () => {
    const res = splitLegacyAddress("Mukherjee Nagar, New Delhi, Delhi, 110009, India", "110009");
    expect(res.line1).toBe("Mukherjee Nagar");
    expect(res.city).toBe("New Delhi");
    expect(res.state).toBe("Delhi");
    expect(res.pinConflict).toBe(false);
  });

  it("handles Bengaluru Karnataka address", () => {
    const res = splitLegacyAddress("12th Main Road, Koramangala, Bengaluru, Karnataka, 560034", "560034");
    expect(res.line1).toBe("12th Main Road, Koramangala");
    expect(res.city).toBe("Bengaluru");
    expect(res.state).toBe("Karnataka");
  });

  it("handles single unformatted string safely", () => {
    const res = splitLegacyAddress("Near Railway Station", "");
    expect(res.line1).toBe("Near Railway Station");
    expect(res.city).toBe("");
    expect(res.state).toBe("");
  });

  it("splits >100 char line1 into line2", () => {
    const longStreet = "A".repeat(120);
    const res = splitLegacyAddress(`${longStreet}, Pune, Maharashtra, 411001`, "411001");
    expect(res.line1.length).toBe(100);
    expect(res.line2.length).toBe(20);
    expect(res.city).toBe("Pune");
    expect(res.state).toBe("Maharashtra");
  });

  it("handles empty inputs", () => {
    const res = splitLegacyAddress("", "");
    expect(res).toEqual({ line1: "", line2: "", city: "", state: "", pin: "", pinConflict: false });
  });

  it("composes structured address and validates Indian PIN", () => {
    expect(
      composeStructuredAddress({
        line1: "Shipra Sun City",
        line2: "Indirapuram",
        city: "Ghaziabad",
        state: "Uttar Pradesh",
        pin: "201014",
      }),
    ).toBe("Shipra Sun City, Indirapuram, Ghaziabad, Uttar Pradesh, 201014, India");
    expect(isValidIndianPin("201014")).toBe(true);
    expect(isValidIndianPin("012345")).toBe(false);
    expect(isValidIndianPin("20101")).toBe(false);
  });
});
