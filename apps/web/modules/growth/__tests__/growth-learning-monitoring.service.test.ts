import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  getGrowthLearningMonitoringSnapshot,
  recordGrowthLearningRun,
  resetGrowthLearningMonitoringForTests,
} from "../growth-learning-monitoring.service";

vi.mock("@/config/feature-flags", () => ({
  growthLearningFlags: {
    growthLearningMonitoringV1: true,
  },
}));

describe("growth-learning-monitoring", () => {
  beforeEach(() => {
    resetGrowthLearningMonitoringForTests();
  });

  it("increments counters when monitoring on", () => {
    recordGrowthLearningRun({
      outcomesLinked: 5,
      insufficientDataCount: 1,
      adjustmentsComputed: 2,
      adjustmentsApplied: 1,
      blockedAdjustmentCount: 0,
      weights: {
        impactWeight: 1,
        confidenceWeight: 1,
        signalStrengthWeight: 1,
        recencyWeight: 1,
        governancePenaltyWeight: 1,
        defaultBiasWeight: 1,
        updatedAt: new Date().toISOString(),
      },
      warningsCount: 0,
    });
    const s = getGrowthLearningMonitoringSnapshot();
    expect(s.learningRuns).toBe(1);
    expect(s.outcomesLinked).toBe(5);
  });
});
