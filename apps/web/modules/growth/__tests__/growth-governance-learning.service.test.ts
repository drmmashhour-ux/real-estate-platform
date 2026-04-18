import { describe, expect, it } from "vitest";
import { computeGrowthLearningControlDecision } from "../growth-governance-learning.service";
import type { GrowthLearningSummary, GrowthLearningWeights } from "../growth-learning.types";

const baseWeights: GrowthLearningWeights = {
  impactWeight: 1,
  confidenceWeight: 1,
  signalStrengthWeight: 1,
  recencyWeight: 1,
  governancePenaltyWeight: 1,
  defaultBiasWeight: 1,
  updatedAt: new Date().toISOString(),
};

function summary(partial: Partial<GrowthLearningSummary>): GrowthLearningSummary {
  return {
    runs: 1,
    signalsEvaluated: 7,
    outcomesLinked: 5,
    positiveRate: 0.4,
    negativeRate: 0.2,
    neutralRate: 0.4,
    adjustmentsApplied: [],
    warnings: [],
    updatedAt: new Date().toISOString(),
    ...partial,
  };
}

describe("computeGrowthLearningControlDecision", () => {
  it("returns normal when signals are healthy", () => {
    const d = computeGrowthLearningControlDecision({
      summary: summary({}),
      insufficientDataCount: 1,
      totalOutcomes: 7,
      weights: baseWeights,
      governanceDecision: null,
      executionFailedCount: 0,
    });
    expect(d.state).toBe("normal");
    expect(d.observedSignals.governanceRisk).toBe("low");
  });

  it("returns monitor when signal count is below minimum", () => {
    const d = computeGrowthLearningControlDecision({
      summary: summary({ signalsEvaluated: 3, outcomesLinked: 3 }),
      insufficientDataCount: 0,
      totalOutcomes: 3,
      weights: baseWeights,
      governanceDecision: null,
      executionFailedCount: 0,
    });
    expect(d.state).toBe("monitor");
  });

  it("freeze_recommended when negative rate is high", () => {
    const d = computeGrowthLearningControlDecision({
      summary: summary({ negativeRate: 0.65, positiveRate: 0.1, neutralRate: 0.25 }),
      insufficientDataCount: 0,
      totalOutcomes: 10,
      weights: baseWeights,
      governanceDecision: null,
      executionFailedCount: 0,
    });
    expect(d.state).toBe("freeze_recommended");
  });

  it("reset_recommended when weight drift at cap", () => {
    const w: GrowthLearningWeights = {
      ...baseWeights,
      impactWeight: 1.25,
    };
    const d = computeGrowthLearningControlDecision({
      summary: summary({}),
      insufficientDataCount: 0,
      totalOutcomes: 7,
      weights: w,
      governanceDecision: null,
      executionFailedCount: 0,
    });
    expect(d.state).toBe("reset_recommended");
  });

  it("freeze_recommended on high governance risk", () => {
    const d = computeGrowthLearningControlDecision({
      summary: summary({}),
      insufficientDataCount: 0,
      totalOutcomes: 7,
      weights: baseWeights,
      governanceDecision: {
        status: "human_review_required",
        topRisks: [],
        blockedDomains: [],
        frozenDomains: [],
        humanReviewItems: [],
        humanReviewQueue: [],
        notes: [],
        createdAt: new Date().toISOString(),
      },
      executionFailedCount: 0,
    });
    expect(d.state).toBe("freeze_recommended");
  });

  it("freeze_recommended when execution failures exceed threshold", () => {
    const d = computeGrowthLearningControlDecision({
      summary: summary({}),
      insufficientDataCount: 0,
      totalOutcomes: 7,
      weights: baseWeights,
      governanceDecision: null,
      executionFailedCount: 5,
    });
    expect(d.state).toBe("freeze_recommended");
  });

  it("does not mutate input objects", () => {
    const s = summary({});
    const w = { ...baseWeights };
    computeGrowthLearningControlDecision({
      summary: s,
      insufficientDataCount: 0,
      totalOutcomes: 7,
      weights: w,
      governanceDecision: null,
      executionFailedCount: 0,
    });
    expect(s.negativeRate).toBe(0.2);
    expect(w.impactWeight).toBe(1);
  });
});
