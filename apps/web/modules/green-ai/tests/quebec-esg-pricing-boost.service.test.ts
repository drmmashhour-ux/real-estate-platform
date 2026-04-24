import { describe, expect, it } from "vitest";
import { generateGreenPricingBoostSignal } from "../quebec-esg-pricing-boost.service";

describe("generateGreenPricingBoostSignal", () => {
  it("is stable for same inputs", () => {
    const a = generateGreenPricingBoostSignal({
      performanceLabel: "IMPROVABLE",
      improvementPotential: "high",
      hasUpgradePath: true,
    });
    const b = generateGreenPricingBoostSignal({
      performanceLabel: "IMPROVABLE",
      improvementPotential: "high",
      hasUpgradePath: true,
    });
    expect(a.rankingBoostSuggestion).toBe(b.rankingBoostSuggestion);
    expect(a.scoreInfluence).toBe(b.scoreInfluence);
  });

  it("GREEN is positive influence", () => {
    const s = generateGreenPricingBoostSignal({ performanceLabel: "GREEN", improvementPotential: "low" });
    expect(s.labelInfluence).toBe("positive");
    expect(s.rankingBoostSuggestion).toBeGreaterThanOrEqual(1);
  });

  it("LOW is neutral or negative", () => {
    const s = generateGreenPricingBoostSignal({ performanceLabel: "LOW" });
    expect(s.labelInfluence).toBe("negative");
  });
});
