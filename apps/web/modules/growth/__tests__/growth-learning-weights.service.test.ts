import { describe, expect, it, beforeEach } from "vitest";
import {
  applyGrowthWeightAdjustments,
  computeGrowthWeightAdjustments,
  getGrowthCurrentWeights,
  resetGrowthLearningWeightsForTests,
} from "../growth-learning-weights.service";
import type { GrowthLearningSummary } from "../growth-learning.types";

describe("growth-learning-weights", () => {
  beforeEach(() => {
    resetGrowthLearningWeightsForTests();
  });

  it("keeps defaults until adjustments applied", () => {
    const w = getGrowthCurrentWeights();
    expect(w.impactWeight).toBe(1);
    expect(w.defaultBiasWeight).toBe(1);
  });

  it("bounds adjustments and preserves drift limits", () => {
    const summary: GrowthLearningSummary = {
      runs: 1,
      signalsEvaluated: 8,
      outcomesLinked: 6,
      positiveRate: 0.6,
      negativeRate: 0.1,
      neutralRate: 0.3,
      adjustmentsApplied: [],
      warnings: [],
      updatedAt: new Date().toISOString(),
    };
    const deltas = computeGrowthWeightAdjustments(summary, getGrowthCurrentWeights());
    expect(Object.keys(deltas).length).toBeGreaterThan(0);
    applyGrowthWeightAdjustments(deltas);
    const w = getGrowthCurrentWeights();
    expect(Math.abs(w.impactWeight - 1)).toBeLessThanOrEqual(0.26);
  });

  it("returns empty deltas when evidence is low", () => {
    const summary: GrowthLearningSummary = {
      runs: 1,
      signalsEvaluated: 2,
      outcomesLinked: 2,
      positiveRate: 0,
      negativeRate: 0,
      neutralRate: 1,
      adjustmentsApplied: [],
      warnings: ["low_evidence: x"],
      updatedAt: new Date().toISOString(),
    };
    expect(Object.keys(computeGrowthWeightAdjustments(summary, getGrowthCurrentWeights())).length).toBe(0);
  });
});
