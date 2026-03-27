import { TRUSTGRAPH_RULE_VERSION } from "@/lib/trustgraph/config";
import type { FsboListingRuleContext, RuleEvaluationResult } from "@/lib/trustgraph/domain/types";

/** FSBO model has city string — postal not always present; conservative stub. */
export function evaluatePostalRegionConsistencyRule(ctx: FsboListingRuleContext): RuleEvaluationResult {
  if (!ctx.phase6?.enabled) {
    return {
      ruleCode: "POSTAL_REGION_CONSISTENCY_RULE",
      ruleVersion: TRUSTGRAPH_RULE_VERSION,
      passed: true,
      scoreDelta: 0,
      confidence: 0,
      details: { skipped: true },
    };
  }
  const cityOk = (ctx.city ?? "").trim().length > 1;
  return {
    ruleCode: "POSTAL_REGION_CONSISTENCY_RULE",
    ruleVersion: TRUSTGRAPH_RULE_VERSION,
    passed: cityOk,
    scoreDelta: cityOk ? 0 : -1,
    confidence: 0.5,
    details: { cityPresent: cityOk },
  };
}
