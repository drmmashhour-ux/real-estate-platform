import { describe, expect, it } from "vitest";
import { computeFinalPrice, normalizeDemandIndexMetrics } from "../dynamic-market-pricing.service";

describe("dynamic-market-pricing guards", () => {
  it("respects min/max clamps", () => {
    expect(
      computeFinalPrice({
        basePrice: 40,
        minPrice: 35,
        maxPrice: 55,
        demandFactor: 2,
        qualityFactor: 2,
      })
    ).toBe(55);

    expect(
      computeFinalPrice({
        basePrice: 40,
        minPrice: 35,
        maxPrice: 55,
        demandFactor: 0.1,
        qualityFactor: 0.1,
      })
    ).toBe(35);
  });

  it("lead band overlay moves price within bounds", () => {
    const hi = computeFinalPrice({
      basePrice: 50,
      minPrice: 29,
      maxPrice: 149,
      demandFactor: 1.05,
      qualityFactor: 1.05,
      overlayMultiplier: 1.14,
    });
    expect(hi).toBeGreaterThan(55);
    expect(hi).toBeLessThanOrEqual(149);
  });

  it("higher demand index yields higher factor target range", () => {
    const low = normalizeDemandIndexMetrics({
      leadsLast30d: 2,
      operatorCount: 5,
      residencesInMarket: 10,
      activeUsersProxy: 500,
    });
    const high = normalizeDemandIndexMetrics({
      leadsLast30d: 48,
      operatorCount: 70,
      residencesInMarket: 110,
      activeUsersProxy: 4800,
    });
    expect(high).toBeGreaterThan(low);
  });
});
