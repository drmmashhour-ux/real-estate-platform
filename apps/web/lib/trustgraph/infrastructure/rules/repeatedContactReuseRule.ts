import { TRUSTGRAPH_RULE_VERSION } from "@/lib/trustgraph/config";
import type { FsboListingRuleContext, RuleEvaluationResult } from "@/lib/trustgraph/domain/types";

export function evaluateRepeatedContactReuseRule(ctx: FsboListingRuleContext): RuleEvaluationResult {
  if (!ctx.phase6?.enabled || !ctx.phase6.antifraud) {
    return {
      ruleCode: "REPEATED_CONTACT_REUSE_RULE",
      ruleVersion: TRUSTGRAPH_RULE_VERSION,
      passed: true,
      scoreDelta: 0,
      confidence: 0,
      details: { skipped: true },
    };
  }
  const n = ctx.phase6.antifraud.contactReuseSignals;
  return {
    ruleCode: "REPEATED_CONTACT_REUSE_RULE",
    ruleVersion: TRUSTGRAPH_RULE_VERSION,
    passed: true,
    scoreDelta: n > 0 ? -1 : 0,
    confidence: 0.6,
    details: { contactReuseSignals: n },
  };
}
