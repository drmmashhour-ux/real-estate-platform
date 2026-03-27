import type { RuleEvaluationResult } from "@/lib/trustgraph/domain/types";

export function evaluateOwnershipProofPresenceStub(): RuleEvaluationResult {
  return {
    ruleCode: "ownership_proof_presence",
    ruleVersion: "1",
    passed: true,
    scoreDelta: 0,
    confidence: 0.5,
    details: { skipped: true },
  };
}
