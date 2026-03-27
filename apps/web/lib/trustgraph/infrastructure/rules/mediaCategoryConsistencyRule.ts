import { TRUSTGRAPH_RULE_VERSION } from "@/lib/trustgraph/config";
import type { FsboListingRuleContext, RuleEvaluationResult } from "@/lib/trustgraph/domain/types";

export function evaluateMediaCategoryConsistencyRule(ctx: FsboListingRuleContext): RuleEvaluationResult {
  if (!ctx.phase6?.enabled) {
    return {
      ruleCode: "MEDIA_CATEGORY_CONSISTENCY_RULE",
      ruleVersion: TRUSTGRAPH_RULE_VERSION,
      passed: true,
      scoreDelta: 0,
      confidence: 0,
      details: { skipped: true },
    };
  }
  const tags = Array.isArray(ctx.photoTagsJson) ? ctx.photoTagsJson.length : 0;
  const imgs = ctx.images.length;
  const consistent = tags === 0 || tags === imgs;
  return {
    ruleCode: "MEDIA_CATEGORY_CONSISTENCY_RULE",
    ruleVersion: TRUSTGRAPH_RULE_VERSION,
    passed: consistent,
    scoreDelta: consistent ? 0 : -1,
    confidence: 0.8,
    details: { tagCount: tags, imageCount: imgs },
  };
}
