import { TRUSTGRAPH_RULE_VERSION } from "@/lib/trustgraph/config";
import type { RuleEvaluationResult } from "@/lib/trustgraph/domain/types";

/** Very short stays may warrant manual review — never auto-reject. */
export function evaluateShortStayRiskRule(ctx: { nights: number }): RuleEvaluationResult {
  const elevated = ctx.nights <= 1;
  return {
    ruleCode: "SHORT_STAY_RISK_RULE",
    ruleVersion: TRUSTGRAPH_RULE_VERSION,
    passed: !elevated,
    scoreDelta: elevated ? -2 : 1,
    confidence: 0.8,
    details: { nights: ctx.nights, elevatedManualReviewHint: elevated },
  };
}
