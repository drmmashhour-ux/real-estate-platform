import { describe, it, expect, beforeEach } from "vitest";
import {
  categorizeBrainV8FallbackReason,
  getBrainV8PrimaryMonitoringSnapshot,
  recordBrainV8PrimaryOutcome,
  recordBrainV8PrimarySuccessOutputShape,
  resetBrainV8PrimaryMonitoringForTests,
} from "./brain-v8-primary-monitoring.service";
import type { BrainSnapshotPayload } from "./brain-snapshot.service";

function emptySnapshot(): BrainSnapshotPayload {
  return {
    weights: [],
    strongestSources: [],
    weakestSources: [],
    notes: [],
    warnings: [],
    lastLearningRun: null,
    timeline: [],
    v3: null,
    recentOutcomes: [],
  };
}

describe("brain v8 post-cutover monitoring", () => {
  beforeEach(() => {
    resetBrainV8PrimaryMonitoringForTests();
  });

  it("categorizes fallback reasons consistently", () => {
    expect(categorizeBrainV8FallbackReason("v8_primary_throw")).toBe("exception");
    expect(categorizeBrainV8FallbackReason("weak_comparison_quality")).toBe("comparison_gate");
    expect(categorizeBrainV8FallbackReason("non_finite_outcome_score")).toBe("validation");
    expect(categorizeBrainV8FallbackReason("empty_shadow_unexpected")).toBe("readiness");
  });

  it("aggregates totals and fallback rate without mutating routing outputs", () => {
    recordBrainV8PrimaryOutcome("success");
    recordBrainV8PrimaryOutcome("fallback", "weak_comparison_quality");
    recordBrainV8PrimaryOutcome("fallback", "v8_primary_throw");
    const s = getBrainV8PrimaryMonitoringSnapshot();
    expect(s.v8PrimarySuccessCount).toBe(1);
    expect(s.v8PrimaryFallbackCount).toBe(2);
    expect(s.postCutover?.totalRuns).toBe(3);
    expect(s.postCutover?.fallbackRatePct).toBeCloseTo(66.67, 0);
    expect(s.postCutover?.reasonBreakdown.weak_comparison_quality).toBe(1);
    expect(s.postCutover?.categoryBreakdown.exception).toBe(1);
  });

  it("recordBrainV8PrimarySuccessOutputShape records mean abs scores", () => {
    const t = new Date();
    const snap: BrainSnapshotPayload = {
      ...emptySnapshot(),
      recentOutcomes: [
        {
          id: "1",
          decisionId: "d1",
          source: "ADS",
          entityType: "C",
          entityId: null,
          actionType: "a",
          outcomeType: "POSITIVE",
          outcomeScore: 0.5,
          observedMetrics: null,
          reason: "r",
          createdAt: t,
        },
        {
          id: "2",
          decisionId: "d2",
          source: "ADS",
          entityType: "C",
          entityId: null,
          actionType: "a",
          outcomeType: "POSITIVE",
          outcomeScore: -0.5,
          observedMetrics: null,
          reason: "r",
          createdAt: t,
        },
      ],
    };
    recordBrainV8PrimarySuccessOutputShape(snap, { recentOutcomes: snap.recentOutcomes });
    const s = getBrainV8PrimaryMonitoringSnapshot();
    expect(s.postCutover?.avgMeanOutcomeScoreLastN).toBe(0.5);
  });
});
