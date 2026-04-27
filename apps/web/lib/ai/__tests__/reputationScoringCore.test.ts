import { describe, expect, it } from "vitest";

import { computeListingReputationFromMetrics } from "../reputationScoringCore";

describe("reputationScoringCore (Order 48)", () => {
  it("strong bookings + conversion + content → high reputation", () => {
    const r = computeListingReputationFromMetrics({
      listingId: "L1",
      bookings: 12,
      views: 200,
      rating: 4.8,
      descriptionLength: 120,
      hasPhoto: true,
      maxRecentPriceChangeRatio: 0.1,
    });
    expect(r.signals).toContain("sustained_bookings");
    expect(r.signals).toContain("healthy_conversion");
    expect(r.level).toBe("high");
    expect(r.score).toBeLessThanOrEqual(1);
    expect(r.score).toBeGreaterThanOrEqual(0.75);
  });

  it("new / sparse listing → not zero; typically low or medium (gentle floor)", () => {
    const r = computeListingReputationFromMetrics({
      listingId: "L-new",
      bookings: 0,
      views: 2,
      rating: 0,
      descriptionLength: 10,
      hasPhoto: false,
    });
    expect(r.score).toBeGreaterThan(0);
    expect(["low", "medium"]).toContain(r.level);
    expect(r.signals).toContain("published_baseline");
  });
});
