import { describe, expect, it } from "vitest";
import { runLearningPass } from "@/lib/learning/engine";

describe("runLearningPass", () => {
  it("returns stable shape with insufficient data", () => {
    const out = runLearningPass({ bookingOutcomes: [] });
    expect(out.generatedAt).toMatch(/^\d{4}-/);
    expect(out.rankingWeights.rationale).toContain("Insufficient");
    expect(out.rankingWeights.bookingsWeightDelta).toBe(0);
  });

  it("suggests weight bump when apartment archetype converts", () => {
    const outcomes = Array.from({ length: 25 }, (_, i) => ({
      archetype: {
        propertyType: "apartment",
        priceTier: "mid" as const,
        cityKey: "damascus",
      },
      success: i < 18,
      nights: 2,
    }));
    const out = runLearningPass({ bookingOutcomes: outcomes });
    expect(out.rankingWeights.bookingsWeightDelta).toBeGreaterThan(0);
    expect(out.rankingWeights.rationale.toLowerCase()).toContain("apartment");
  });
});
