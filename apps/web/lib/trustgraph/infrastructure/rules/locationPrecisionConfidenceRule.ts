import { TRUSTGRAPH_RULE_VERSION } from "@/lib/trustgraph/config";
import { getPhase6MoatConfig } from "@/lib/trustgraph/config/phase6-moat";
import type { FsboListingRuleContext, RuleEvaluationResult } from "@/lib/trustgraph/domain/types";

export function evaluateLocationPrecisionConfidenceRule(ctx: FsboListingRuleContext): RuleEvaluationResult {
  if (!ctx.phase6?.enabled || !ctx.phase6.geospatial) {
    return {
      ruleCode: "LOCATION_PRECISION_CONFIDENCE_RULE",
      ruleVersion: TRUSTGRAPH_RULE_VERSION,
      passed: true,
      scoreDelta: 0,
      confidence: 0,
      details: { skipped: true },
    };
  }
  const cfg = getPhase6MoatConfig().geospatial;
  const p = ctx.phase6.geospatial.precisionScore ?? 0;
  const weak = p < cfg.weakPrecisionWarningBelow;
  return {
    ruleCode: "LOCATION_PRECISION_CONFIDENCE_RULE",
    ruleVersion: TRUSTGRAPH_RULE_VERSION,
    passed: true,
    scoreDelta: weak ? -1 : 0,
    confidence: 0.65,
    details: { precisionScore: p, weak },
    signals: weak
      ? [
          {
            signalCode: "WEAK_GEO_PRECISION",
            signalName: "Weak location precision",
            category: "address",
            severity: "low",
            scoreImpact: -1,
            confidence: 0.5,
            evidence: {},
            message: "Geocode precision is uncertain — review optional.",
          },
        ]
      : undefined,
  };
}
