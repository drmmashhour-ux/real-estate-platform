import { describe, it, expect } from "vitest";
import { computeContentPerformanceScore } from "../scoring";

describe("computeContentPerformanceScore", () => {
  it("weights bookings and revenue above raw views", () => {
    const low = computeContentPerformanceScore({
      views: 10000,
      clicks: 0,
      saves: 0,
      shares: 0,
      conversions: 0,
      bookings: 0,
      revenueCents: 0,
    });
    const high = computeContentPerformanceScore({
      views: 100,
      clicks: 10,
      saves: 5,
      shares: 2,
      conversions: 1,
      bookings: 2,
      revenueCents: 500_000,
    });
    expect(high).toBeGreaterThan(low);
  });
});
