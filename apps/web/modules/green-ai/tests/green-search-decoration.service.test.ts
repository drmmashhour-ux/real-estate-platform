import { describe, expect, it } from "vitest";
import { decorateListingWithGreenSignals, toPublicListingGreenPayload } from "../green-search-decoration.service";

describe("decorateListingWithGreenSignals", () => {
  it("returns null-safe fields and never throws on empty input", () => {
    const d = decorateListingWithGreenSignals({});
    expect(d).toBeDefined();
    expect(d.currentScore).toBeNull();
    expect(d.disclaimers.length).toBeGreaterThan(0);
  });

  it("distinguishes current vs projected when snapshot + engine path used", () => {
    const d = decorateListingWithGreenSignals({
      yearBuilt: 2010,
      lecipmGreenMetadataJson: {
        quebecEsgSnapshot: {
          score: 60,
          label: "STANDARD",
          breakdown: { heating: 40, insulation: 50, windows: 50, energyEfficiency: 50, materials: 50, water: 50, bonus: 0 },
          improvementAreas: ["envelope"],
          disclaimer: "x",
        },
        greenSearchSnapshot: { projectedScore: 78, scoreDelta: 12 },
      },
    });
    expect(d.currentScore).toBe(60);
    expect(d.projectedScore).toBe(78);
    expect(d.scoreDelta).toBe(12);
  });

  it("public payload always includes disclaimer", () => {
    const d = decorateListingWithGreenSignals({ yearBuilt: 2000 });
    const p = toPublicListingGreenPayload(d);
    expect(p.disclaimer.length).toBeGreaterThan(20);
  });

  it("merges recommendations, incentives, ROI, and pricing-boost snapshots into rationale and boost", () => {
    const d = decorateListingWithGreenSignals({
      id: "x1",
      lecipmGreenMetadataJson: {
        quebecEsgSnapshot: {
          score: 55,
          label: "STANDARD",
          breakdown: { heating: 50, insulation: 50, windows: 50, energyEfficiency: 50, materials: 50, water: 50, bonus: 0 },
          improvementAreas: ["x"],
          disclaimer: "d",
        },
        recommendationsSnapshot: ["Attic air sealing", "Window phasing plan"],
        incentivesSnapshot: { totalIllustrativeCad: 2000, updatedAtIso: "2020-01-01" },
        roiSnapshot: { bandLabel: "moderate", note: "Illustrative only" },
        pricingBoostSnapshot: { boostFactor: 1.08 },
        greenSearchSnapshot: { rankingBoostSuggestion: 1.02 },
      },
    });
    expect(d.rankingBoostSuggestion).toBeGreaterThanOrEqual(1.08);
    expect(d.rationale.some((r) => r.includes("Recommendation (cached)"))).toBe(true);
    expect(d.rationale.some((r) => r.includes("ROI") || r.includes("band"))).toBe(true);
    expect(d.estimatedIncentives).toBe(2000);
  });
});
