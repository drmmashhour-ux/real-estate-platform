import type { FsboListingRuleContext, RuleEvaluationResult } from "@/lib/trustgraph/domain/types";

const CODE = "suspicious_pricing";
const VERSION = "1";

export function evaluateSuspiciousPricingRule(ctx: FsboListingRuleContext, priceCents: number): RuleEvaluationResult {
  const sf = Number(ctx.description.match(/(\d+)\s*sq\s*ft/i)?.[1] ?? ctx.description.match(/(\d+)\s*sf\b/i)?.[1]);
  if (!sf || sf <= 0 || !Number.isFinite(priceCents) || priceCents < 10_000) {
    return {
      ruleCode: CODE,
      ruleVersion: VERSION,
      passed: true,
      scoreDelta: 0,
      confidence: 0.5,
      details: { skipped: true },
    };
  }

  const ppsf = priceCents / 100 / sf;
  if (ppsf < 20) {
    return {
      ruleCode: CODE,
      ruleVersion: VERSION,
      passed: false,
      scoreDelta: -8,
      confidence: 0.55,
      details: { priceCents, inferredSqft: sf, ppsf },
      signals: [
        {
          signalCode: `${CODE}_low_ppsf`,
          signalName: "Unusually low price per sqft (heuristic)",
          category: "financial",
          severity: "medium",
          scoreImpact: -8,
          confidence: 0.55,
          evidence: { ppsf, inferredSqft: sf },
          message: "Price per square foot looks unusually low compared to typical market bands — please verify.",
        },
      ],
    };
  }

  return {
    ruleCode: CODE,
    ruleVersion: VERSION,
    passed: true,
    scoreDelta: 2,
    confidence: 0.6,
    details: { ppsf },
  };
}
