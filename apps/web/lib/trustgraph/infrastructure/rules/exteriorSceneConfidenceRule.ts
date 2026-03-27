import { TRUSTGRAPH_RULE_VERSION } from "@/lib/trustgraph/config";
import { getPhase6MoatConfig } from "@/lib/trustgraph/config/phase6-moat";
import type { FsboListingRuleContext, RuleEvaluationResult } from "@/lib/trustgraph/domain/types";

export function evaluateExteriorSceneConfidenceRule(ctx: FsboListingRuleContext): RuleEvaluationResult {
  if (!ctx.phase6?.enabled || !ctx.phase6.media) {
    return {
      ruleCode: "EXTERIOR_SCENE_CONFIDENCE_RULE",
      ruleVersion: TRUSTGRAPH_RULE_VERSION,
      passed: true,
      scoreDelta: 0,
      confidence: 0,
      details: { skipped: true },
    };
  }
  const cfg = getPhase6MoatConfig().media;
  const ec = ctx.phase6.media.exteriorConfidence;
  const ok = ec >= cfg.minExteriorConfidence;
  return {
    ruleCode: "EXTERIOR_SCENE_CONFIDENCE_RULE",
    ruleVersion: TRUSTGRAPH_RULE_VERSION,
    passed: ok,
    scoreDelta: ok ? 1 : 0,
    confidence: 0.55,
    details: { exteriorConfidence: ec, threshold: cfg.minExteriorConfidence },
  };
}
