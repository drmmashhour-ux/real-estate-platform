import { TRUSTGRAPH_RULE_VERSION } from "@/lib/trustgraph/config";
import type { FsboListingRuleContext, RuleEvaluationResult } from "@/lib/trustgraph/domain/types";

/** Compares extraction hint to user-entered property type — never overwrites user data. */
export function evaluateExtractionDeclarationConsistencyRule(ctx: FsboListingRuleContext): RuleEvaluationResult {
  if (!ctx.phase6?.enabled || !ctx.phase6.extraction) {
    return {
      ruleCode: "EXTRACTION_DECLARATION_CONSISTENCY_RULE",
      ruleVersion: TRUSTGRAPH_RULE_VERSION,
      passed: true,
      scoreDelta: 0,
      confidence: 0,
      details: { skipped: true },
    };
  }
  const hint = ctx.phase6.extraction.normalizedPropertyType?.trim().toLowerCase() ?? "";
  const user = (ctx.propertyType ?? "").trim().toLowerCase();
  if (!hint || !user) {
    return {
      ruleCode: "EXTRACTION_DECLARATION_CONSISTENCY_RULE",
      ruleVersion: TRUSTGRAPH_RULE_VERSION,
      passed: true,
      scoreDelta: 0,
      confidence: 0.4,
      details: { comparable: false },
    };
  }
  const aligned = hint.includes(user) || user.includes(hint);
  return {
    ruleCode: "EXTRACTION_DECLARATION_CONSISTENCY_RULE",
    ruleVersion: TRUSTGRAPH_RULE_VERSION,
    passed: true,
    scoreDelta: aligned ? 0 : -1,
    confidence: ctx.phase6.extraction.confidence,
    details: { hint, user, aligned, reviewNeeded: ctx.phase6.extraction.reviewNeeded },
  };
}
