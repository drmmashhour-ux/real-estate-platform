import { describe, expect, it } from "vitest";
import { computeDynamicLeadPrice } from "@/modules/leads/dynamic-pricing.service";

describe("computeDynamicLeadPrice", () => {
  it("caps multiplier at 2x and keeps suggested within [base, 2*base]", () => {
    const s = computeDynamicLeadPrice({
      leadId: "x",
      basePrice: 50,
      qualityScore: 100,
      demandLevel: "high",
      brokerInterestLevel: 100,
      historicalConversion: 1,
    });
    expect(s.basePrice).toBe(50);
    expect(s.priceMultiplier).toBeLessThanOrEqual(2);
    expect(s.suggestedPrice).toBeLessThanOrEqual(100);
    expect(s.suggestedPrice).toBeGreaterThanOrEqual(50);
    expect(s.demandLevel).toBe("high");
  });
});
