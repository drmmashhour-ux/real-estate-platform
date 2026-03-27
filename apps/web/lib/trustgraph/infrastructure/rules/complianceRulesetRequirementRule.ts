import { TRUSTGRAPH_RULE_VERSION } from "@/lib/trustgraph/config";
import type { FsboListingRuleContext, RuleEvaluationResult } from "@/lib/trustgraph/domain/types";

export function evaluateComplianceRulesetRequirementRule(ctx: FsboListingRuleContext): RuleEvaluationResult {
  if (!ctx.phase8?.enabled) {
    return {
      ruleCode: "COMPLIANCE_RULESET_REQUIREMENT_RULE",
      ruleVersion: TRUSTGRAPH_RULE_VERSION,
      passed: true,
      scoreDelta: 0,
      confidence: 0,
      details: { skipped: true },
    };
  }
  const missing = ctx.phase8.missingRequirements ?? [];
  const passed = missing.length === 0;
  return {
    ruleCode: "COMPLIANCE_RULESET_REQUIREMENT_RULE",
    ruleVersion: TRUSTGRAPH_RULE_VERSION,
    passed,
    scoreDelta: passed ? 0 : -2,
    confidence: 0.85,
    details: {
      rulesetCode: ctx.phase8.rulesetCode,
      missingRequirements: missing,
    },
  };
}
