import { TRUSTGRAPH_RULE_VERSION } from "@/lib/trustgraph/config";
import type { FsboListingRuleContext, ListingRuleRunOptions, RuleEvaluationResult } from "@/lib/trustgraph/domain/types";

export function evaluateCrossListingMediaReuseRule(
  ctx: FsboListingRuleContext,
  opts: ListingRuleRunOptions
): RuleEvaluationResult {
  if (!ctx.phase6?.enabled) {
    return {
      ruleCode: "CROSS_LISTING_MEDIA_REUSE_RULE",
      ruleVersion: TRUSTGRAPH_RULE_VERSION,
      passed: true,
      scoreDelta: 0,
      confidence: 0,
      details: { skipped: true },
    };
  }
  const n = opts.duplicateSha256AcrossOtherListings.length;
  return {
    ruleCode: "CROSS_LISTING_MEDIA_REUSE_RULE",
    ruleVersion: TRUSTGRAPH_RULE_VERSION,
    passed: true,
    scoreDelta: n > 0 ? -2 : 0,
    confidence: 0.85,
    details: { crossListingDuplicateHashCount: n },
  };
}
