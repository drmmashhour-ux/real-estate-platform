import { describe, expect, it } from "vitest";
import {
  computeHybridRecommendationScore,
  DEFAULT_HYBRID_WEIGHTS,
  mergeHybridWeights,
} from "@/lib/recommendations/compute-recommendation-score";

describe("hybrid recommendation score", () => {
  it("returns higher score when similarity and popularity are higher", () => {
    const low = computeHybridRecommendationScore(
      {
        similarity_score: 0.3,
        preference_score: 0.3,
        popularity_score: 0.2,
        quality_score: 0.4,
        exploration_score: 0.2,
      },
      DEFAULT_HYBRID_WEIGHTS
    );
    const high = computeHybridRecommendationScore(
      {
        similarity_score: 0.9,
        preference_score: 0.85,
        popularity_score: 0.8,
        quality_score: 0.85,
        exploration_score: 0.5,
      },
      DEFAULT_HYBRID_WEIGHTS
    );
    expect(high).toBeGreaterThan(low);
  });

  it("mergeHybridWeights renormalizes", () => {
    const w = mergeHybridWeights(DEFAULT_HYBRID_WEIGHTS, { similarity_score: 0.5 });
    const sum = Object.values(w).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 5);
  });
});
