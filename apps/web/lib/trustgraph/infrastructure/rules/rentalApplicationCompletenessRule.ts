import type { RuleEvaluationResult } from "@/lib/trustgraph/domain/types";

export function evaluateRentalApplicationCompletenessStub(): RuleEvaluationResult {
  return {
    ruleCode: "rental_application_completeness",
    ruleVersion: "1",
    passed: true,
    scoreDelta: 0,
    confidence: 0.5,
    details: { skipped: true },
  };
}
