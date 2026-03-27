import { MIN_LISTING_PRICE_CENTS } from "@/lib/trustgraph/config/listing-rules-config";
import type { FsboListingRuleContext, RuleEvaluationResult } from "@/lib/trustgraph/domain/types";
import { TRUSTGRAPH_RULE_VERSION } from "@/lib/trustgraph/config";

const CODE = "SUSPICIOUS_PRICE_RULE";

/**
 * Conservative pricing checks only — no market AVM.
 */
export function evaluateSuspiciousPriceRule(ctx: FsboListingRuleContext): RuleEvaluationResult {
  const priceCents = ctx.priceCents;

  if (!Number.isFinite(priceCents) || priceCents < MIN_LISTING_PRICE_CENTS) {
    return {
      ruleCode: CODE,
      ruleVersion: TRUSTGRAPH_RULE_VERSION,
      passed: false,
      scoreDelta: -15,
      confidence: 1,
      details: { priceCents },
      signals: [
        {
          signalCode: `${CODE}_invalid_price`,
          signalName: "Invalid list price",
          category: "financial",
          severity: "high",
          scoreImpact: -15,
          confidence: 1,
          evidence: { priceCents },
          message: "List price must be a positive amount.",
        },
      ],
    };
  }

  const sf = Number(ctx.description.match(/(\d+)\s*sq\s*ft/i)?.[1] ?? ctx.description.match(/(\d+)\s*sf\b/i)?.[1]);
  if (!sf || sf <= 0 || priceCents < 10_000) {
    return {
      ruleCode: CODE,
      ruleVersion: TRUSTGRAPH_RULE_VERSION,
      passed: true,
      scoreDelta: 0,
      confidence: 0.5,
      details: { skipped: true, reason: "insufficient_sqft_context" },
    };
  }

  const ppsf = priceCents / 100 / sf;
  if (ppsf < 20) {
    return {
      ruleCode: CODE,
      ruleVersion: TRUSTGRAPH_RULE_VERSION,
      passed: false,
      scoreDelta: -6,
      confidence: 0.5,
      details: { priceCents, inferredSqft: sf, ppsf },
      signals: [
        {
          signalCode: `${CODE}_low_ppsf`,
          signalName: "Unusually low price per sqft (heuristic)",
          category: "financial",
          severity: "low",
          scoreImpact: -6,
          confidence: 0.5,
          evidence: { ppsf, inferredSqft: sf },
          message: "Price per square foot looks unusually low — verify list price and square footage in the description.",
        },
      ],
    };
  }

  return {
    ruleCode: CODE,
    ruleVersion: TRUSTGRAPH_RULE_VERSION,
    passed: true,
    scoreDelta: 2,
    confidence: 0.55,
    details: { ppsf },
  };
}
