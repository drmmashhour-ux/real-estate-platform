import { describe, it, expect } from "vitest";
import {
  computeTrustScore,
  computeBaseTrustScore,
  getSourceAdaptiveWeight,
  computeExecutionPriority,
  isExecutionAllowed,
} from "./trust-engine.service";
import type { BrainSourceWeight } from "./brain-v2.types";
import { processBrainDecision } from "./one-brain.processor";

describe("trust-engine.service", () => {
  it("computes trust in 0..1", () => {
    const t = computeTrustScore({ confidenceScore: 0.8, evidenceScore: 0.8, learningSignals: ["a"] });
    expect(t).toBeLessThanOrEqual(1);
    expect(t).toBeGreaterThan(0.5);
  });

  it("applies adaptive source weight and caps at 1", () => {
    const base = computeBaseTrustScore({ confidenceScore: 0.9, evidenceScore: 0.9 });
    const t = computeTrustScore({ confidenceScore: 0.9, evidenceScore: 0.9, sourceWeight: 1.2 });
    expect(t).toBeLessThanOrEqual(1);
    expect(t).toBeGreaterThanOrEqual(base);
  });

  it("getSourceAdaptiveWeight falls back to 1", () => {
    expect(getSourceAdaptiveWeight("ADS", [])).toBe(1);
    const snap: BrainSourceWeight[] = [
      {
        source: "ADS",
        weight: 1.1,
        confidence: 0.5,
        sampleCount: 1,
        positiveCount: 0,
        negativeCount: 0,
        neutralCount: 1,
      },
    ];
    expect(getSourceAdaptiveWeight("ADS", snap)).toBe(1.1);
  });

  it("execution priority tiers", () => {
    expect(computeExecutionPriority(0.85)).toBe(3);
    expect(computeExecutionPriority(0.65)).toBe(2);
    expect(computeExecutionPriority(0.3)).toBe(1);
  });

  it("execution allowed threshold", () => {
    expect(isExecutionAllowed(0.66)).toBe(true);
    expect(isExecutionAllowed(0.64)).toBe(false);
  });
});

describe("one-brain.processor", () => {
  it("blocks when blockers present", () => {
    const out = processBrainDecision({
      source: "ADS",
      entityType: "CAMPAIGN",
      actionType: "TEST",
      confidenceScore: 0.9,
      evidenceScore: 0.9,
      reason: "r",
      blockers: ["x"],
    });
    expect(out.executionAllowed).toBe(false);
    expect(out.sourceWeightApplied).toBe(1);
    expect(out.adaptationReason.length).toBeGreaterThan(0);
  });

  it("stable deterministic outputs for same input", () => {
    const input = {
      source: "CRO" as const,
      entityType: "LISTING" as const,
      actionType: "TEST",
      confidenceScore: 0.7,
      evidenceScore: 0.7,
      reason: "r",
      sourceWeight: 1.1,
    };
    const a = processBrainDecision(input);
    const b = processBrainDecision(input);
    expect(a.trustScore).toBe(b.trustScore);
    expect(a.rankingImpact).toBe(b.rankingImpact);
  });
});
