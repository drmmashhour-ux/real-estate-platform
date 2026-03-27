import { TRUSTGRAPH_RULE_VERSION } from "@/lib/trustgraph/config";
import { getPhase6MoatConfig } from "@/lib/trustgraph/config/phase6-moat";
import type { FsboListingRuleContext, RuleEvaluationResult } from "@/lib/trustgraph/domain/types";

export function evaluateSuspiciousEntityLinkDensityRule(ctx: FsboListingRuleContext): RuleEvaluationResult {
  if (!ctx.phase6?.enabled || !ctx.phase6.antifraud) {
    return {
      ruleCode: "SUSPICIOUS_ENTITY_LINK_DENSITY_RULE",
      ruleVersion: TRUSTGRAPH_RULE_VERSION,
      passed: true,
      scoreDelta: 0,
      confidence: 0,
      details: { skipped: true },
    };
  }
  const cfg = getPhase6MoatConfig().antifraud;
  const score = ctx.phase6.antifraud.duplicateHashCount + ctx.phase6.antifraud.contactReuseSignals;
  const elevated = score >= cfg.clusterReviewThreshold;
  return {
    ruleCode: "SUSPICIOUS_ENTITY_LINK_DENSITY_RULE",
    ruleVersion: TRUSTGRAPH_RULE_VERSION,
    passed: true,
    scoreDelta: elevated ? -1 : 0,
    confidence: 0.5,
    details: { combinedScore: score, threshold: cfg.clusterReviewThreshold, elevated },
  };
}
