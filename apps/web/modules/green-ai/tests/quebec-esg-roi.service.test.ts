import { describe, expect, it } from "vitest";
import { calculateQuebecEsgRetrofitRoi } from "../quebec-esg-roi.service";

describe("calculateQuebecEsgRetrofitRoi", () => {
  it("produces narrative when net band unknown", () => {
    const r = calculateQuebecEsgRetrofitRoi({
      currentEvaluationScore: 50,
      projectedEvaluationScore: 62,
      costEstimates: { costEstimates: [], totalLowCost: null, totalHighCost: null },
      incentiveEstimates: { incentives: [], totalEstimatedIncentives: null },
    });
    expect(r.scoreDelta).toBe(12);
    expect(r.simpleRoiNarrative.length).toBeGreaterThan(0);
  });

  it("includes resale scenarios without percentage promises", () => {
    const r = calculateQuebecEsgRetrofitRoi({
      currentEvaluationScore: 55,
      projectedEvaluationScore: 70,
      costEstimates: { costEstimates: [], totalLowCost: 20_000, totalHighCost: 40_000 },
      incentiveEstimates: { incentives: [], totalEstimatedIncentives: 5_000 },
      optionalListingPriceCad: 500_000,
    });
    const blob = [...r.resaleImpactScenario.conservative, ...r.resaleImpactScenario.neutral].join(" ");
    expect(blob.toLowerCase()).not.toMatch(/\d+%\s*return/);
    expect(r.paybackNotes.some((n) => n.toLowerCase().includes("payback"))).toBe(true);
  });
});
