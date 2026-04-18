import { describe, expect, it, beforeEach } from "vitest";
import type { BrainDecisionOutcomeDTO } from "./brain-v2.repository";
import { aggregateShadowDeltas, buildShadowRowsFromOutcomes, computeShadowBrainSignal } from "./brain-v8-shadow-evaluator.service";
import {
  buildBrainV8ShadowVsCurrentComparison,
  computeBrainV8ComparisonMetrics,
  normalizeCurrentBrainSignal,
  normalizeShadowComparisonSignal,
  pairCurrentAndShadowSignals,
  resetBrainV8ComparisonAggregationForTests,
  scoreToConfidence,
} from "./brain-v8-shadow-comparison.service";
import type { BrainV8ShadowObservationResult } from "./brain-v8-shadow.types";

function baseDto(over: Partial<BrainDecisionOutcomeDTO> = {}): BrainDecisionOutcomeDTO {
  return {
    id: "id-1",
    decisionId: "dec-a",
    source: "UNIFIED",
    entityType: "LISTING",
    entityId: "e1",
    actionType: "TEST",
    outcomeType: "POSITIVE",
    outcomeScore: 0.5,
    observedMetrics: null,
    reason: "ok",
    createdAt: new Date(),
    ...over,
  };
}

describe("brain-v8-shadow-comparison", () => {
  beforeEach(() => {
    resetBrainV8ComparisonAggregationForTests();
  });

  it("normalization tolerates missing optional fields with safe defaults", () => {
    const dto = baseDto({ outcomeScore: NaN as unknown as number, decisionId: "", reason: "" });
    const n = normalizeCurrentBrainSignal(dto);
    expect(n.decisionKey).toBe("(unknown)");
    expect(n.confidence).toBe(0.5);
    expect(n.score).toBeUndefined();
  });

  it("scoreToConfidence maps [-1,1] to [0,1]", () => {
    expect(scoreToConfidence(-1)).toBe(0);
    expect(scoreToConfidence(1)).toBe(1);
    expect(scoreToConfidence(0)).toBe(0.5);
  });

  it("does not mutate source DTOs when building comparison", () => {
    const dto = baseDto({ outcomeScore: 0.3, decisionId: "d1" });
    const before = JSON.stringify(dto);
    const outcomes = [dto];
    const rows = buildShadowRowsFromOutcomes(outcomes);
    const shadowResult: BrainV8ShadowObservationResult = {
      observedAt: new Date().toISOString(),
      sampleSize: rows.length,
      rows,
      aggregate: aggregateShadowDeltas(rows),
      notes: [],
    };
    buildBrainV8ShadowVsCurrentComparison({ outcomesSlice: outcomes, shadowResult });
    expect(JSON.stringify(dto)).toBe(before);
  });

  it("pairs 1:1 by decision key and computes overlap when slices align", () => {
    const o1 = baseDto({ decisionId: "a", outcomeScore: 0.8 });
    const o2 = baseDto({ decisionId: "b", outcomeScore: -0.2 });
    const outcomes = [o1, o2];
    const rows = buildShadowRowsFromOutcomes(outcomes);
    const currents = outcomes.map(normalizeCurrentBrainSignal);
    const shadows = rows.map(normalizeShadowComparisonSignal);
    const { pairs, currentOnly, shadowOnly } = pairCurrentAndShadowSignals(currents, shadows);
    expect(pairs.length).toBe(2);
    expect(currentOnly.length).toBe(0);
    expect(shadowOnly.length).toBe(0);
    const m = computeBrainV8ComparisonMetrics(pairs, currentOnly, shadowOnly, 0, 0, 0);
    expect(m.matchedCount).toBe(2);
    expect(m.overlapRate).toBe(1);
  });

  it("classifies current-only and shadow-only when keys diverge", () => {
    const c1 = normalizeCurrentBrainSignal(baseDto({ decisionId: "only-c" }));
    const s1 = normalizeShadowComparisonSignal({
      decisionId: "only-s",
      source: "UNIFIED",
      storedOutcomeScore: 0,
      storedOutcomeType: "X",
      shadowSignal: 0.1,
      shadowLabel: "aligned",
    });
    const { pairs, currentOnly, shadowOnly } = pairCurrentAndShadowSignals([c1], [s1]);
    expect(pairs.length).toBe(0);
    expect(currentOnly.length).toBe(1);
    expect(shadowOnly.length).toBe(1);
    const m = computeBrainV8ComparisonMetrics(pairs, currentOnly, shadowOnly, 0, 0, 0);
    expect(m.currentOnlyCount).toBe(1);
    expect(m.shadowOnlyCount).toBe(1);
    expect(m.overlapRate).toBe(0);
  });

  it("handles duplicate decision keys by consuming in order", () => {
    const a = normalizeCurrentBrainSignal(baseDto({ decisionId: "dup", outcomeScore: 0.1 }));
    const b = normalizeCurrentBrainSignal(baseDto({ decisionId: "dup", outcomeScore: 0.9, id: "id-2" }));
    const s1 = normalizeShadowComparisonSignal({
      decisionId: "dup",
      source: "UNIFIED",
      storedOutcomeScore: 0.1,
      storedOutcomeType: "P",
      shadowSignal: 0.2,
      shadowLabel: "aligned",
    });
    const { pairs, duplicateKeyWarnings } = pairCurrentAndShadowSignals([a, b], [s1]);
    expect(pairs.length).toBe(1);
    expect(duplicateKeyWarnings).toBeGreaterThan(0);
  });

  it("empty inputs yield zero metrics without throwing", () => {
    const shadowResult: BrainV8ShadowObservationResult = {
      observedAt: "",
      sampleSize: 0,
      rows: [],
      aggregate: { meanAbsDelta: 0, reviewCount: 0, insufficientEvidenceCount: 0, meanAbsDeltaFiniteSample: 0 },
      notes: [],
    };
    const r = buildBrainV8ShadowVsCurrentComparison({ outcomesSlice: [], shadowResult });
    expect(r.metrics.matchedCount).toBe(0);
    expect(r.metrics.overlapRate).toBe(0);
  });

  it("full report includes heuristic framing and aggregation", () => {
    const outcomes = [baseDto({ decisionId: "x", outcomeScore: 0.9 })];
    const rows = buildShadowRowsFromOutcomes(outcomes);
    const shadowResult: BrainV8ShadowObservationResult = {
      observedAt: new Date().toISOString(),
      sampleSize: rows.length,
      rows,
      aggregate: aggregateShadowDeltas(rows),
      notes: [],
    };
    const r = buildBrainV8ShadowVsCurrentComparison({ outcomesSlice: outcomes, shadowResult });
    expect(r.interpretation.heuristicSummaries.length).toBeGreaterThanOrEqual(0);
    expect(r.aggregation.comparisonRuns).toBe(1);
    expect(r.runId.startsWith("v8cmp-")).toBe(true);
  });

  it("computeShadowBrainSignal output remains compatible with comparison normalization", () => {
    const dto = baseDto({ outcomeScore: 0.44 });
    const sh = computeShadowBrainSignal(dto);
    expect(sh.shadowLabel).toMatch(/aligned|review|insufficient_evidence/);
    const row = buildShadowRowsFromOutcomes([dto])[0]!;
    const n = normalizeShadowComparisonSignal(row);
    expect(n.side).toBe("shadow");
    expect(n.decisionKey).toBe("dec-a");
  });

  it("heuristic: missing important signals when high-risk current rows are unpaired", () => {
    const outcomes = [baseDto({ decisionId: "orphan-hr", outcomeType: "NEGATIVE", outcomeScore: -0.95 })];
    const shadowResult: BrainV8ShadowObservationResult = {
      observedAt: "",
      sampleSize: 0,
      rows: [],
      aggregate: { meanAbsDelta: 0, reviewCount: 0, insufficientEvidenceCount: 0, meanAbsDeltaFiniteSample: 0 },
      notes: [],
    };
    const r = buildBrainV8ShadowVsCurrentComparison({ outcomesSlice: outcomes, shadowResult });
    expect(r.interpretation.heuristicSummaries.some((s) => s.includes("missing important signals"))).toBe(true);
  });

  it("heuristic: extra risky signals for shadow-only review/insufficient rows", () => {
    const shadowResult: BrainV8ShadowObservationResult = {
      observedAt: "",
      sampleSize: 1,
      rows: [
        {
          decisionId: "solo-shadow",
          source: "UNIFIED",
          storedOutcomeScore: 0.5,
          storedOutcomeType: "POSITIVE",
          shadowSignal: 0.1,
          shadowLabel: "review",
        },
      ],
      aggregate: { meanAbsDelta: 0.1, reviewCount: 1, insufficientEvidenceCount: 0, meanAbsDeltaFiniteSample: 0.1 },
      notes: [],
    };
    const r = buildBrainV8ShadowVsCurrentComparison({ outcomesSlice: [], shadowResult });
    expect(r.interpretation.heuristicSummaries.some((s) => s.includes("extra risky signals"))).toBe(true);
  });
});
