import { describe, expect, it } from "vitest";
import { computePropertyLegalRiskScore } from "../property-legal-risk-score.service";
import type { QuebecListingComplianceEvaluationResult } from "../../compliance/quebec-listing-compliance-evaluator.service";

function minimalEvaluation(
  overrides: Partial<QuebecListingComplianceEvaluationResult>,
): QuebecListingComplianceEvaluationResult {
  return {
    listingId: "l1",
    legacyChecklist: {
      domain: "listing",
      items: [],
      results: [],
      readinessScore: 40,
      blockingIssues: ["qc_listing_property_basic_data_present"],
      warnings: [],
    },
    effectiveResults: [],
    supplementalOnly: [],
    readinessScore: 40,
    blockingIssues: ["qc_listing_property_basic_data_present"],
    warnings: [],
    requiredChecklistPassed: false,
    evidenceSummary: { fraudCriticalCount: 0, ruleCriticalCount: 0, legalIntelCriticalCount: 0 },
    definitionRows: [],
    ...overrides,
  };
}

describe("property-legal-risk-score.service", () => {
  it("returns deterministic score with factors", () => {
    const ce = minimalEvaluation({});
    const out = computePropertyLegalRiskScore({ listingId: "l1", complianceEvaluation: ce });
    expect(out.score).toBeGreaterThanOrEqual(0);
    expect(out.score).toBeLessThanOrEqual(100);
    expect(out.factors.length).toBeGreaterThan(0);
  });
});
