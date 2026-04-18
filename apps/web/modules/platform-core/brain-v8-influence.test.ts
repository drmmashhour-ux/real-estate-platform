import { describe, expect, it, vi } from "vitest";
import type { BrainSnapshotPayload } from "./brain-snapshot.service";
import {
  applyBrainV8Influence,
  applyBrainV8PresentationOverlay,
  buildBrainV8ComparisonQuality,
  buildShadowObservationFromSnapshot,
} from "./brain-v8-influence.service";
import type { BrainV8ShadowObservationResult } from "./brain-v8-shadow.types";

vi.mock("@/config/feature-flags", async (importOriginal) => {
  const a = await importOriginal<typeof import("@/config/feature-flags")>();
  return {
    ...a,
    oneBrainV8Flags: {
      ...a.oneBrainV8Flags,
      brainV8InfluenceV1: true,
      brainV8ShadowObservationV1: true,
      brainV8ShadowPersistenceV1: false,
      brainV8PrimaryV1: false,
    },
  };
});

function outcome(
  id: string,
  decisionId: string,
  score: number,
  t: Date,
): BrainSnapshotPayload["recentOutcomes"][number] {
  return {
    id,
    decisionId,
    source: "ADS",
    entityType: "C",
    entityId: null,
    actionType: "a",
    outcomeType: "POSITIVE",
    outcomeScore: score,
    observedMetrics: null,
    reason: `r-${decisionId}`,
    createdAt: t,
  };
}

function baseSnapshot(): BrainSnapshotPayload {
  const t = new Date();
  return {
    weights: [],
    strongestSources: [],
    weakestSources: [],
    notes: [],
    warnings: [],
    lastLearningRun: null,
    timeline: [],
    v3: null,
    recentOutcomes: [outcome("o1", "d1", 0.5, t), outcome("o2", "d2", 0.4, t)],
  };
}

/** Four finite scores at 0.4 → shadow evaluator labels aligned with low mean delta (strong comparison gate). */
function strongComparisonSnapshot(): BrainSnapshotPayload {
  const t = new Date();
  return {
    ...baseSnapshot(),
    recentOutcomes: [
      outcome("o1", "d1", 0.4, t),
      outcome("o2", "d2", 0.4, t),
      outcome("o3", "d3", 0.4, t),
      outcome("o4", "d4", 0.4, t),
    ],
  };
}

describe("brain-v8-influence", () => {
  it("applyBrainV8PresentationOverlay passes through when influence flag mocked on — produces overlay or clone", () => {
    const snap = baseSnapshot();
    const before = JSON.stringify(snap.recentOutcomes.map((x) => x.decisionId));
    const out = applyBrainV8PresentationOverlay(snap);
    expect(out.recentOutcomes.length).toBe(snap.recentOutcomes.length);
    expect(JSON.stringify(snap.recentOutcomes.map((x) => x.decisionId))).toBe(before);
  });

  it("weak comparison skips applied influence", () => {
    const snap = baseSnapshot();
    const shadow: BrainV8ShadowObservationResult = {
      observedAt: new Date().toISOString(),
      sampleSize: 1,
      rows: [],
      aggregate: {
        meanAbsDelta: 0,
        reviewCount: 0,
        insufficientEvidenceCount: 0,
        meanAbsDeltaFiniteSample: 0,
      },
      notes: [],
    };
    const quality = buildBrainV8ComparisonQuality(shadow);
    expect(quality.weakComparison).toBe(true);
    const out = applyBrainV8Influence(snap, shadow, quality);
    expect(out.brainV8Influence?.applied).toBe(false);
  });

  it("strong agreement + good quality applies bounded influence (applied true, no fewer outcomes)", () => {
    const snap = strongComparisonSnapshot();
    const shadow = buildShadowObservationFromSnapshot(snap);
    const quality = buildBrainV8ComparisonQuality(shadow);
    expect(quality.weakComparison).toBe(false);
    const out = applyBrainV8Influence(snap, shadow, quality);
    expect(out.brainV8Influence?.applied).toBe(true);
    expect(out.recentOutcomes).toHaveLength(4);
    expect(out.brainV8Influence?.stats.boosted).toBeGreaterThan(0);
  });

  it("buildBrainV8ComparisonQuality is not weak for healthy aggregate", () => {
    const q = buildBrainV8ComparisonQuality({
      observedAt: "",
      sampleSize: 8,
      rows: [],
      notes: [],
      aggregate: {
        meanAbsDelta: 0.08,
        reviewCount: 1,
        insufficientEvidenceCount: 1,
        meanAbsDeltaFiniteSample: 0.08,
      },
    });
    expect(q.weakComparison).toBe(false);
  });

  it("does not remove outcomes", () => {
    const snap = baseSnapshot();
    const shadow = buildShadowObservationFromSnapshot(snap);
    const quality = buildBrainV8ComparisonQuality(shadow);
    if (quality.weakComparison) {
      const out = applyBrainV8Influence(snap, shadow, quality);
      expect(out.recentOutcomes.length).toBe(2);
      return;
    }
    const out = applyBrainV8Influence(snap, shadow, quality);
    expect(out.recentOutcomes.length).toBe(2);
  });
});
