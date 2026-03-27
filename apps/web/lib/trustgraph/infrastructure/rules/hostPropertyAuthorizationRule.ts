import { TRUSTGRAPH_RULE_VERSION } from "@/lib/trustgraph/config";
import type { RuleEvaluationResult } from "@/lib/trustgraph/domain/types";

export function evaluateHostPropertyAuthorizationRule(ctx: { ownershipConfirmationStatus: string }): RuleEvaluationResult {
  const passed = ctx.ownershipConfirmationStatus === "confirmed";
  return {
    ruleCode: "HOST_PROPERTY_AUTHORIZATION_RULE",
    ruleVersion: TRUSTGRAPH_RULE_VERSION,
    passed,
    scoreDelta: passed ? 10 : -6,
    confidence: 1,
    details: { ownershipConfirmationStatus: ctx.ownershipConfirmationStatus },
  };
}
