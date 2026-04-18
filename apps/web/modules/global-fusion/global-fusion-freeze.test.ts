import { describe, expect, it, beforeEach } from "vitest";
import {
  applyGlobalFusionFreeze,
  clearGlobalFusionFreezeForTests,
  getGlobalFusionFreezeState,
  isFusionInfluenceFrozen,
  isFusionLearningFrozen,
} from "./global-fusion-freeze.service";

describe("global-fusion-freeze", () => {
  beforeEach(() => {
    clearGlobalFusionFreezeForTests();
  });

  it("applies learning freeze and clears for tests", () => {
    applyGlobalFusionFreeze({ learning: true, reason: "test" });
    expect(isFusionLearningFrozen()).toBe(true);
    clearGlobalFusionFreezeForTests();
    expect(isFusionLearningFrozen()).toBe(false);
  });

  it("applies influence freeze", () => {
    applyGlobalFusionFreeze({ influence: true, reason: "test" });
    expect(isFusionInfluenceFrozen()).toBe(true);
  });
});
