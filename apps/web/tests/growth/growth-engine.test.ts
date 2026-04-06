import { describe, expect, it } from "vitest";
import { runGrowthOpportunityScan } from "@/lib/growth/engine";

describe("runGrowthOpportunityScan", () => {
  it("detects city supply gap and listing conversion gap", () => {
    const opps = runGrowthOpportunityScan({
      cities: [{ cityKey: "damascus", sessionsEstimate: 500, listingCount: 2 }],
      listings: [{ listingId: "x", views: 100, bookings: 0 }],
    });
    expect(opps.some((o) => o.kind === "city_supply_gap")).toBe(true);
    expect(opps.some((o) => o.kind === "listing_conversion_gap")).toBe(true);
  });
});
