import { describe, expect, it, beforeEach } from "vitest";
import {
  applyGlobalFusionWeightAdjustments,
  computeGlobalFusionWeightAdjustments,
  getGlobalFusionCurrentWeights,
  GLOBAL_FUSION_DEFAULT_SOURCE_WEIGHTS,
  resetGlobalFusionWeightsForTests,
} from "./global-fusion-learning-weights.service";
import { globalFusionFlags } from "@/config/feature-flags";

describe("global-fusion-learning-weights", () => {
  beforeEach(() => {
    resetGlobalFusionWeightsForTests();
    (globalFusionFlags as { globalFusionLearningV1: boolean }).globalFusionLearningV1 = false;
    (globalFusionFlags as { globalFusionLearningAdaptiveWeightsV1: boolean }).globalFusionLearningAdaptiveWeightsV1 = false;
  });

  it("returns defaults when learning flags off", () => {
    const w = getGlobalFusionCurrentWeights();
    expect(w.brain).toBe(GLOBAL_FUSION_DEFAULT_SOURCE_WEIGHTS.brain);
  });

  it("keeps adjustments bounded when adaptive on", () => {
    (globalFusionFlags as { globalFusionLearningV1: boolean }).globalFusionLearningV1 = true;
    (globalFusionFlags as { globalFusionLearningAdaptiveWeightsV1: boolean }).globalFusionLearningAdaptiveWeightsV1 = true;
    const adj = computeGlobalFusionWeightAdjustments(
      { brain: 0.9, ads: 0.2, cro: 0.5, ranking: 0.5 },
      0.55,
    );
    const n = applyGlobalFusionWeightAdjustments(adj);
    expect(n).toBeGreaterThanOrEqual(0);
    const w = getGlobalFusionCurrentWeights();
    const sum = w.brain + w.ads + w.cro + w.ranking;
    expect(sum).toBeGreaterThan(0.99);
    expect(sum).toBeLessThan(1.01);
  });

  it("blocks adjustment when global hit unknown", () => {
    (globalFusionFlags as { globalFusionLearningV1: boolean }).globalFusionLearningV1 = true;
    (globalFusionFlags as { globalFusionLearningAdaptiveWeightsV1: boolean }).globalFusionLearningAdaptiveWeightsV1 = true;
    const adj = computeGlobalFusionWeightAdjustments({}, null);
    expect(adj.every((a) => a.blocked)).toBe(true);
  });
});
