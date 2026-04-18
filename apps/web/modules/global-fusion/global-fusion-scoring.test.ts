import { describe, expect, it, beforeEach } from "vitest";
import { computeGlobalFusionScores } from "./global-fusion-scoring.service";
import { normalizeControlCenterSystems } from "./global-fusion-normalizer.service";
import { minimalControlCenterSystems } from "./test-fixtures/minimal-control-center-systems";
import { resetGlobalFusionWeightsForTests } from "./global-fusion-learning-weights.service";
import { clearGlobalFusionFreezeForTests } from "./global-fusion-freeze.service";

describe("computeGlobalFusionScores", () => {
  beforeEach(() => {
    resetGlobalFusionWeightsForTests();
    clearGlobalFusionFreezeForTests();
  });
  it("returns bounded scores in 0–1", () => {
    const sys = minimalControlCenterSystems();
    const { signals } = normalizeControlCenterSystems(sys, 0);
    const scores = computeGlobalFusionScores(signals, []);
    expect(scores.fusedConfidence).toBeGreaterThanOrEqual(0);
    expect(scores.fusedConfidence).toBeLessThanOrEqual(1);
    expect(scores.agreementScore).toBeGreaterThanOrEqual(0);
    expect(scores.agreementScore).toBeLessThanOrEqual(1);
    expect(Number.isFinite(scores.actionability)).toBe(true);
  });

  it("reduces agreement when conflicts present", () => {
    const sys = minimalControlCenterSystems();
    const { signals } = normalizeControlCenterSystems(sys, 0);
    const a = computeGlobalFusionScores(signals, []);
    const b = computeGlobalFusionScores(signals, [
      {
        id: "x",
        systems: ["brain", "ads"],
        severity: "high",
        summary: "t",
        recommendation: "defer",
        detail: "d",
      },
    ]);
    expect(b.agreementScore).toBeLessThanOrEqual(a.agreementScore);
  });
});
