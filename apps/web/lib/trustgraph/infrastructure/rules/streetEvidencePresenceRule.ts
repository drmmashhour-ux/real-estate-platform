import { TRUSTGRAPH_RULE_VERSION } from "@/lib/trustgraph/config";
import { countStreetTaggedPhotos } from "@/lib/trustgraph/infrastructure/services/streetEvidenceService";
import type { FsboListingRuleContext, RuleEvaluationResult } from "@/lib/trustgraph/domain/types";

export function evaluateStreetEvidencePresenceRule(ctx: FsboListingRuleContext): RuleEvaluationResult {
  if (!ctx.phase6?.enabled) {
    return {
      ruleCode: "STREET_EVIDENCE_PRESENCE_RULE",
      ruleVersion: TRUSTGRAPH_RULE_VERSION,
      passed: true,
      scoreDelta: 0,
      confidence: 0,
      details: { skipped: true },
    };
  }
  const n = countStreetTaggedPhotos(ctx.photoTagsJson, ctx.images.length);
  const streetConf = ctx.phase6.media?.streetConfidence ?? 0;
  const passed = n > 0 || streetConf > 0.2;
  return {
    ruleCode: "STREET_EVIDENCE_PRESENCE_RULE",
    ruleVersion: TRUSTGRAPH_RULE_VERSION,
    passed,
    scoreDelta: passed ? 1 : 0,
    confidence: 0.6,
    details: { streetTaggedCount: n },
  };
}
