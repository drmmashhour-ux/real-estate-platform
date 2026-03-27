import { describe, expect, it } from "vitest";
import { calculateLeadPriceCents, calculateMarketplaceListingScore } from "../application/calculateLeadPrice";

describe("calculateLeadPriceCents", () => {
  it("increases price with better scores and demand", () => {
    const low = calculateLeadPriceCents({
      dealScore: 40,
      trustScore: 40,
      engagementScore: 10,
      highIntent: false,
      cityDemand01: 0.2,
    });
    const high = calculateLeadPriceCents({
      dealScore: 90,
      trustScore: 90,
      engagementScore: 80,
      highIntent: true,
      cityDemand01: 0.9,
    });
    expect(high).toBeGreaterThan(low);
  });

  it("stays within configured cents band", () => {
    const v = calculateLeadPriceCents({
      dealScore: 50,
      trustScore: 50,
      engagementScore: 50,
      highIntent: false,
      cityDemand01: 0.5,
    });
    expect(v).toBeGreaterThanOrEqual(2_900);
    expect(v).toBeLessThanOrEqual(29_900 * 1.2);
  });
});

describe("calculateMarketplaceListingScore", () => {
  it("returns 0-100", () => {
    const s = calculateMarketplaceListingScore({
      dealScore: 80,
      trustScore: 70,
      engagementScore: 60,
      highIntent: true,
      cityDemand01: 0.5,
    });
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(100);
  });
});
