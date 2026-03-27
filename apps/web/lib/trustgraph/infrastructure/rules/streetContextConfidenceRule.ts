import { TRUSTGRAPH_RULE_VERSION } from "@/lib/trustgraph/config";
import { getPhase6MoatConfig } from "@/lib/trustgraph/config/phase6-moat";
import type { FsboListingRuleContext, RuleEvaluationResult } from "@/lib/trustgraph/domain/types";

export function evaluateStreetContextConfidenceRule(ctx: FsboListingRuleContext): RuleEvaluationResult {
  if (!ctx.phase6?.enabled || !ctx.phase6.media) {
    return {
      ruleCode: "STREET_CONTEXT_CONFIDENCE_RULE",
      ruleVersion: TRUSTGRAPH_RULE_VERSION,
      passed: true,
      scoreDelta: 0,
      confidence: 0,
      details: { skipped: true },
    };
  }
  const cfg = getPhase6MoatConfig().media;
  const sc = ctx.phase6.media.streetConfidence;
  const ok = sc >= cfg.minStreetContextConfidence;
  return {
    ruleCode: "STREET_CONTEXT_CONFIDENCE_RULE",
    ruleVersion: TRUSTGRAPH_RULE_VERSION,
    passed: ok,
    scoreDelta: ok ? 0 : 0,
    confidence: 0.5,
    details: { streetConfidence: sc, threshold: cfg.minStreetContextConfidence },
  };
}
