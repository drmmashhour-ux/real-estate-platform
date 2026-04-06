import { describe, expect, it } from "vitest";
import { suggestPricingAdjustment } from "@/lib/revenue/pricing-engine";

describe("suggestPricingAdjustment", () => {
  it("suggests decrease when views high and conversion low", () => {
    const s = suggestPricingAdjustment({
      viewCount: 100,
      bookingCount: 0,
      occupancyRate: 0.2,
      currentNightPriceCents: 10_000,
    });
    expect(s.kind).toBe("suggest_decrease");
    expect(s.deltaPercent).toBeLessThan(0);
  });

  it("suggests increase when occupancy and conversion strong", () => {
    const s = suggestPricingAdjustment({
      viewCount: 40,
      bookingCount: 4,
      occupancyRate: 0.85,
      currentNightPriceCents: 12_000,
    });
    expect(s.kind).toBe("suggest_increase");
    expect(s.deltaPercent).toBeGreaterThan(0);
  });
});
