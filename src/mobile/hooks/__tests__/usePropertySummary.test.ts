import { describe, expect, it } from "vitest";
import { computePropertySummary } from "../usePropertySummary";

describe("computePropertySummary", () => {
  it("enforces occupiedBeds + vacantBeds === totalBeds and consistent tenant counts", () => {
    const summary = computePropertySummary({
      propertyId: "prop-1",
      rooms: [
        { totalBeds: 4, occupiedBeds: 3, availableBeds: 1 },
        { totalBeds: 3, occupiedBeds: 2, availableBeds: 1 },
        { totalBeds: 2, occupiedBeds: 0, availableBeds: 2 },
      ],
      tenants: [
        { id: "t1", kycVerified: true } as any,
        { id: "t2", kycVerified: false, isOnNotice: true } as any,
        { id: "t3", kycStatus: "pending" } as any,
      ],
      complaints: [{ status: "open" }, { status: "in_progress" }, { status: "resolved" }],
      kycApps: [
        { propertyId: "prop-1", status: "pending" },
        { propertyId: "prop-1", status: "verified" },
        { propertyId: "prop-2", status: "pending" },
      ],
    });

    expect(summary.occupiedBeds).toBe(5);
    expect(summary.vacantBeds).toBe(4);
    expect(summary.occupiedBeds + summary.vacantBeds).toBe(summary.totalBeds);
    expect(summary.totalBeds).toBe(9);
    expect(summary.occupancyPct).toBe(56);
    expect(summary.totalTenants).toBe(3);
    expect(summary.kycPendingTenants).toBe(2);
    expect(summary.onNoticeTenants).toBe(1);
    expect(summary.totalOpenTickets).toBe(2);
    expect(summary.pendingKycApplications).toBe(1);
  });
});
