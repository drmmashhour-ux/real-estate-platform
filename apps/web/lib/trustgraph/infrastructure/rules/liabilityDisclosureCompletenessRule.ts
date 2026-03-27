import { TRUSTGRAPH_RULE_VERSION } from "@/lib/trustgraph/config";
import type { RuleEvaluationResult } from "@/lib/trustgraph/domain/types";

/** Uses declared credit band as a minimal liability disclosure proxy (no protected attributes). */
export function evaluateLiabilityDisclosureCompletenessRule(ctx: { creditRange: string | null }): RuleEvaluationResult {
  const passed = (ctx.creditRange ?? "").trim().length > 0;
  return {
    ruleCode: "LIABILITY_DISCLOSURE_COMPLETENESS_RULE",
    ruleVersion: TRUSTGRAPH_RULE_VERSION,
    passed,
    scoreDelta: passed ? 6 : -6,
    confidence: 0.7,
    details: { hasCreditBand: passed },
  };
}
