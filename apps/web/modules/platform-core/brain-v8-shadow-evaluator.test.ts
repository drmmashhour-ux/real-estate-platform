import { describe, expect, it } from "vitest";
import {
  aggregateShadowDeltas,
  buildShadowRowsFromOutcomes,
  computeShadowBrainSignal,
} from "./brain-v8-shadow-evaluator.service";
import type { BrainDecisionOutcomeDTO } from "./brain-v2.repository";

function dto(partial: Partial<BrainDecisionOutcomeDTO> & Pick<BrainDecisionOutcomeDTO, "decisionId">): BrainDecisionOutcomeDTO {
  return {
    id: "id",
    source: "ADS",
    entityType: "CAMPAIGN",
    entityId: null,
    actionType: "X",
    outcomeType: "POSITIVE",
    outcomeScore: 0.2,
    observedMetrics: null,
    reason: "r",
    createdAt: new Date(),
    ...partial,
  };
}

describe("brain-v8-shadow-evaluator", () => {
  it("computes shadow signal without throwing", () => {
    const r = computeShadowBrainSignal(dto({ decisionId: "d1", outcomeScore: 0.1 }));
    expect(typeof r.shadowSignal).toBe("number");
    expect(r.shadowLabel === "aligned" || r.shadowLabel === "review").toBe(true);
    expect(r.insufficientEvidence).toBe(false);
  });

  it("marks non-finite outcome scores as insufficient_evidence", () => {
    const r = computeShadowBrainSignal(dto({ decisionId: "d2", outcomeScore: Number.NaN }));
    expect(r.shadowLabel).toBe("insufficient_evidence");
    expect(r.insufficientEvidence).toBe(true);
  });

  it("aggregateShadowDeltas handles empty outcomes", () => {
    const a = aggregateShadowDeltas([]);
    expect(a.meanAbsDelta).toBe(0);
    expect(a.insufficientEvidenceCount).toBe(0);
  });

  it("does not mutate source DTOs", () => {
    const d = dto({ decisionId: "d3", outcomeScore: 0.4 });
    const before = JSON.stringify(d);
    buildShadowRowsFromOutcomes([d]);
    expect(JSON.stringify(d)).toBe(before);
  });
});
