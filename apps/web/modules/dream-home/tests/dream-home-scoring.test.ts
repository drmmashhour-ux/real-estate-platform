import { describe, expect, it } from "vitest";
import {
  buildDefaultRankingPreferences,
  scoreFilterFit,
  suggestBedroomBathMinimums,
} from "../utils/dream-home-scoring";
import type { DreamHomeProfile } from "../types/dream-home.types";

describe("suggestBedroomBathMinimums", () => {
  it("increases with family and guests (explicit)", () => {
    const a = suggestBedroomBathMinimums({ familySize: 2, guestsFrequency: "low" });
    const b = suggestBedroomBathMinimums({ familySize: 2, guestsFrequency: "high" });
    expect(b.minBedrooms).toBeGreaterThanOrEqual(a.minBedrooms);
  });
});

describe("buildDefaultRankingPreferences", () => {
  it("produces weights that sum to ~1", () => {
    const w = buildDefaultRankingPreferences({ familySize: 3, workFromHome: "full_time" });
    const s =
      w.weightPrivacy +
      w.weightHosting +
      w.weightFamilyFunctionality +
      w.weightKitchen +
      w.weightOutdoor +
      w.weightWorkFromHome +
      w.weightAccessibility +
      w.weightQuietness +
      w.weightStyleFit;
    expect(s).toBeGreaterThan(0.99);
    expect(s).toBeLessThan(1.01);
  });
});

describe("scoreFilterFit", () => {
  it("scores higher when within budget and bedroom min", () => {
    const f: DreamHomeProfile["searchFilters"] = { minBedrooms: 2, budgetMax: 500_000 };
    const a = scoreFilterFit(f, { priceCents: 400_000 * 100, bedrooms: 2, bathrooms: 2 });
    expect(a.score).toBeGreaterThan(0.4);
  });
});
