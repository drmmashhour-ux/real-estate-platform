import { TRUSTGRAPH_RULE_VERSION } from "@/lib/trustgraph/config";
import type { FsboListingRuleContext, RuleEvaluationResult } from "@/lib/trustgraph/domain/types";

export function evaluatePhotoDocumentMismatchRule(ctx: FsboListingRuleContext): RuleEvaluationResult {
  if (!ctx.phase6?.enabled || !ctx.phase6.media) {
    return {
      ruleCode: "PHOTO_DOCUMENT_MISMATCH_RULE",
      ruleVersion: TRUSTGRAPH_RULE_VERSION,
      passed: true,
      scoreDelta: 0,
      confidence: 0,
      details: { skipped: true },
    };
  }
  const mismatch = ctx.phase6.media.documentMismatch;
  return {
    ruleCode: "PHOTO_DOCUMENT_MISMATCH_RULE",
    ruleVersion: TRUSTGRAPH_RULE_VERSION,
    passed: !mismatch,
    scoreDelta: mismatch ? -1 : 0,
    confidence: 0.45,
    details: { documentMismatch: mismatch },
  };
}
