import { TRUSTGRAPH_RULE_VERSION } from "@/lib/trustgraph/config";
import type { FsboListingRuleContext, RuleEvaluationResult } from "@/lib/trustgraph/domain/types";

export function evaluateAddressGeocodeMatchRule(ctx: FsboListingRuleContext): RuleEvaluationResult {
  if (!ctx.phase6?.enabled || !ctx.phase6.geospatial) {
    return {
      ruleCode: "ADDRESS_GEOCODE_MATCH_RULE",
      ruleVersion: TRUSTGRAPH_RULE_VERSION,
      passed: true,
      scoreDelta: 0,
      confidence: 0,
      details: { skipped: true },
    };
  }
  const g = ctx.phase6.geospatial;
  const match = g.cityMatch !== false;
  return {
    ruleCode: "ADDRESS_GEOCODE_MATCH_RULE",
    ruleVersion: TRUSTGRAPH_RULE_VERSION,
    passed: true,
    scoreDelta: match ? 1 : -1,
    confidence: 0.7,
    details: { cityMatch: g.cityMatch, warnings: g.warnings },
    signals: match
      ? undefined
      : [
          {
            signalCode: "GEOCODE_CITY_MISMATCH",
            signalName: "City vs geocode mismatch (review)",
            category: "address",
            severity: "medium",
            scoreImpact: -1,
            confidence: 0.6,
            evidence: {},
            message: "Listing city may not match geocoded location — review suggested.",
          },
        ],
  };
}
