import { describe, expect, it } from "vitest";
import { computeSourceHitRates, evaluateLearningOutcomes } from "./global-fusion-learning-evaluator.service";
import type { GlobalFusionLearningOutcome } from "./global-fusion.types";

describe("global-fusion-learning-evaluator", () => {
  it("computes hit rates from outcomes", () => {
    const outcomes: GlobalFusionLearningOutcome[] = [
      {
        signalId: "a",
        observedAt: new Date().toISOString(),
        outcomeType: "proxy_success",
        success: true,
        linkageStrength: "strong",
        source: "brain",
      },
      {
        signalId: "b",
        observedAt: new Date().toISOString(),
        outcomeType: "proxy_failure",
        success: false,
        linkageStrength: "strong",
        source: "brain",
      },
    ];
    const r = evaluateLearningOutcomes(outcomes);
    expect(r.recommendationHitRate).toBe(0.5);
    expect(r.perSourceHits.brain?.total).toBe(2);
    expect(r.perSourceHits.brain?.hits).toBe(1);
    const hr = computeSourceHitRates(r.perSourceHits);
    expect(hr.brain).toBe(0.5);
  });

  it("handles empty outcomes safely", () => {
    const r = evaluateLearningOutcomes([]);
    expect(r.recommendationHitRate).toBeNull();
  });
});
