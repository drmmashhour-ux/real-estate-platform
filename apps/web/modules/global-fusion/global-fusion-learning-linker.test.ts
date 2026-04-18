import { describe, expect, it } from "vitest";
import { buildLearningSignalsFromNormalized, linkOutcomesToSignals } from "./global-fusion-learning-linker.service";
import { minimalControlCenterSystems } from "./test-fixtures/minimal-control-center-systems";
import type { GlobalFusionNormalizedSignal } from "./global-fusion.types";

function sig(over: Partial<GlobalFusionNormalizedSignal> = {}): GlobalFusionNormalizedSignal {
  return {
    id: "brain:x",
    source: "brain",
    targetType: "subsystem",
    targetId: "t",
    confidence: 0.7,
    priority: 0.5,
    risk: 0.3,
    evidenceQuality: 0.5,
    recommendationType: "x",
    reason: [],
    blockers: [],
    metrics: {},
    timestamp: new Date().toISOString(),
    freshnessMs: 1,
    provenance: "p",
    ...over,
  };
}

describe("global-fusion-learning-linker", () => {
  it("builds learning signals without mutating inputs", () => {
    const signals = [sig(), sig({ id: "ads:y", source: "ads" })];
    const scores = {
      fusedConfidence: 0.6,
      fusedPriority: 0.5,
      fusedRisk: 0.4,
      actionability: 0.5,
      agreementScore: 0.6,
      evidenceScore: 0.5,
    };
    const before = JSON.stringify(signals);
    const ls = buildLearningSignalsFromNormalized(signals, scores);
    expect(ls.length).toBe(2);
    expect(JSON.stringify(signals)).toBe(before);
  });

  it("links outcomes with weak or strong linkage", () => {
    const systems = minimalControlCenterSystems();
    const ls = buildLearningSignalsFromNormalized([sig()], {
      fusedConfidence: 0.6,
      fusedPriority: 0.5,
      fusedRisk: 0.4,
      actionability: 0.5,
      agreementScore: 0.6,
      evidenceScore: 0.5,
    });
    const out = linkOutcomesToSignals(ls, systems);
    expect(out.length).toBe(1);
    expect(out[0].linkageStrength).not.toBe("unavailable");
  });
});
