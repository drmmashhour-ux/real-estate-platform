import { TRUSTGRAPH_RULE_VERSION } from "@/lib/trustgraph/config";
import type { FsboListingRuleContext, RuleEvaluationResult } from "@/lib/trustgraph/domain/types";

export function evaluateRepeatedDocumentFingerprintRule(ctx: FsboListingRuleContext): RuleEvaluationResult {
  if (!ctx.phase6?.enabled || !ctx.phase6.antifraud) {
    return {
      ruleCode: "REPEATED_DOCUMENT_FINGERPRINT_RULE",
      ruleVersion: TRUSTGRAPH_RULE_VERSION,
      passed: true,
      scoreDelta: 0,
      confidence: 0,
      details: { skipped: true },
    };
  }
  const n = ctx.phase6.antifraud.duplicateHashCount;
  return {
    ruleCode: "REPEATED_DOCUMENT_FINGERPRINT_RULE",
    ruleVersion: TRUSTGRAPH_RULE_VERSION,
    passed: true,
    scoreDelta: n > 0 ? -2 : 0,
    confidence: 0.75,
    details: { duplicateMediaAcrossListings: n },
  };
}
