import { describe, it, expect } from "vitest";
import { getPricingRecommendation } from "../services/pricing.service.js";

describe("pricing", () => {
  it("returns recommendation with range and confidence", () => {
    const out = getPricingRecommendation({
      location: "NYC",
      propertyType: "Apartment",
      demandLevel: "medium",
      nearbyListingPrices: [10000, 12000, 14000],
    });
    expect(out.recommendedNightlyCents).toBeGreaterThan(0);
    expect(out.suggestedMinCents).toBeLessThanOrEqual(out.recommendedNightlyCents);
    expect(out.suggestedMaxCents).toBeGreaterThanOrEqual(out.recommendedNightlyCents);
    expect(["low", "medium", "high"]).toContain(out.confidenceLevel);
    expect(out.factors.length).toBeGreaterThan(0);
  });

  it("increases price for high demand", () => {
    const low = getPricingRecommendation({ location: "LA", demandLevel: "low", nearbyListingPrices: [10000] });
    const high = getPricingRecommendation({ location: "LA", demandLevel: "high", nearbyListingPrices: [10000] });
    expect(high.recommendedNightlyCents).toBeGreaterThan(low.recommendedNightlyCents);
  });
});
