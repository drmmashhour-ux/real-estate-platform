/**
 * Experiment modes reuse the same pricing signals as dynamic pricing — only weighting/caps differ.
 * All outputs are bounded; deterministic; advisory only.
 */

import type { LeadPricingContext } from "@/modules/leads/dynamic-pricing.types";
import type { LeadMonetizationControlSummary } from "@/modules/leads/lead-monetization-control.types";
import {
  LEAD_DYNAMIC_PRICING_MAX_MULT,
  combineLayerMultipliers,
  computeDynamicLeadPrice,
  getLeadPricingLayerMultipliers,
} from "@/modules/leads/dynamic-pricing.service";
import type { LeadPricingExperimentMode, LeadPricingExperimentResult } from "@/modules/leads/lead-pricing-experiments.types";

const CONSERVATIVE_MAX_MULT = 1.35;

function assertNever(x: never): never {
  throw new Error(`Unexpected experiment mode: ${String(x)}`);
}

function buildContext(
  basePrice: number,
  monetization: LeadMonetizationControlSummary,
  historicalConversion?: number | null,
): LeadPricingContext {
  const qs =
    typeof monetization.qualityScore === "number" && Number.isFinite(monetization.qualityScore)
      ? monetization.qualityScore
      : 0;
  return {
    leadId: monetization.leadId,
    basePrice,
    qualityScore: qs,
    demandLevel: monetization.demandLevel ?? "low",
    brokerInterestLevel:
      typeof monetization.brokerInterestLevel === "number" ? monetization.brokerInterestLevel : 0,
    historicalConversion:
      historicalConversion != null && Number.isFinite(historicalConversion)
        ? historicalConversion
        : undefined,
  };
}

function confidenceFromMonetization(
  level: LeadMonetizationControlSummary["confidenceLevel"],
): LeadPricingExperimentResult["confidenceLevel"] {
  return level;
}

export function computeLeadPricingExperimentMode(
  mode: LeadPricingExperimentMode,
  input: {
    basePrice: number;
    monetization: LeadMonetizationControlSummary;
    historicalConversion?: number | null;
  },
): LeadPricingExperimentResult {
  const ctx = buildContext(input.basePrice, input.monetization, input.historicalConversion);
  const layers = getLeadPricingLayerMultipliers(ctx);
  const base = layers.base;
  const conf = confidenceFromMonetization(input.monetization.confidenceLevel);

  const lowWarnings: string[] = [];
  if (input.monetization.confidenceLevel === "low") {
    lowWarnings.push("Monetization confidence is low — treat all experiment lanes as exploratory.");
  }

  switch (mode) {
    case "baseline": {
      return {
        mode,
        suggestedPrice: base,
        deltaFromBase: 0,
        confidenceLevel: conf,
        reasons: [
          "Baseline uses the revenue-engine reference only (same dollars as monetization `basePrice`).",
          "No layered multiplier is applied in this lane — compare other modes against this anchor.",
        ],
        warnings: lowWarnings,
      };
    }
    case "quality_weighted": {
      const { multiplier, suggestedPrice } = combineLayerMultipliers(
        layers,
        { qm: 1.18, dm: 0.9, bm: 0.94, cm: 1 },
        LEAD_DYNAMIC_PRICING_MAX_MULT,
      );
      const full = computeDynamicLeadPrice(ctx);
      return {
        mode,
        suggestedPrice,
        deltaFromBase: suggestedPrice - base,
        confidenceLevel: conf,
        reasons: [
          "Quality layer exponent ↑ while demand/broker layers are slightly damped — emphasizes fit/completeness signals.",
          `Combined multiplier ×${multiplier.toFixed(3)} (capped at ×${LEAD_DYNAMIC_PRICING_MAX_MULT}) vs production dynamic advisory $${full.suggestedPrice}.`,
        ],
        warnings: lowWarnings,
      };
    }
    case "demand_weighted": {
      const { multiplier, suggestedPrice } = combineLayerMultipliers(
        layers,
        { qm: 0.9, dm: 1.2, bm: 1.04, cm: 1 },
        LEAD_DYNAMIC_PRICING_MAX_MULT,
      );
      const full = computeDynamicLeadPrice(ctx);
      return {
        mode,
        suggestedPrice,
        deltaFromBase: suggestedPrice - base,
        confidenceLevel: conf,
        reasons: [
          "Demand layer exponent ↑ — stresses regional/intent density while slightly muting pure quality scaling.",
          `Combined multiplier ×${multiplier.toFixed(3)} (capped at ×${LEAD_DYNAMIC_PRICING_MAX_MULT}) vs production dynamic advisory $${full.suggestedPrice}.`,
        ],
        warnings: lowWarnings,
      };
    }
    case "conservative": {
      const rawProduct = layers.qm * layers.dm * layers.bm * layers.cm;
      const multiplier = Math.min(CONSERVATIVE_MAX_MULT, Math.max(1, rawProduct));
      const suggestedPrice = Math.round(
        Math.min(base * CONSERVATIVE_MAX_MULT, Math.max(base, base * multiplier)),
      );
      return {
        mode,
        suggestedPrice,
        deltaFromBase: suggestedPrice - base,
        confidenceLevel: conf,
        reasons: [
          `Same layer product as production dynamic (${rawProduct.toFixed(3)}) but total uplift is capped at ×${CONSERVATIVE_MAX_MULT} instead of ×${LEAD_DYNAMIC_PRICING_MAX_MULT}.`,
          "Use this lane to preview a tighter advisory ceiling when messaging risk matters.",
        ],
        warnings: [
          ...lowWarnings,
          suggestedPrice >= base * CONSERVATIVE_MAX_MULT - 1
            ? "Hit conservative cap — further upside is intentionally suppressed in this lane."
            : "",
        ].filter(Boolean),
      };
    }
    case "aggressive": {
      const { multiplier, suggestedPrice } = combineLayerMultipliers(
        layers,
        { qm: 1.1, dm: 1.1, bm: 1.06, cm: 1 },
        LEAD_DYNAMIC_PRICING_MAX_MULT,
      );
      const full = computeDynamicLeadPrice(ctx);
      return {
        mode,
        suggestedPrice,
        deltaFromBase: suggestedPrice - base,
        confidenceLevel: conf,
        reasons: [
          "Layers are nudged upward via exponents — still bounded by the same ×2 advisory cap as production dynamic pricing.",
          `Combined multiplier ×${multiplier.toFixed(3)} (capped at ×${LEAD_DYNAMIC_PRICING_MAX_MULT}) vs production dynamic advisory $${full.suggestedPrice}.`,
        ],
        warnings: [
          ...lowWarnings,
          suggestedPrice >= base * LEAD_DYNAMIC_PRICING_MAX_MULT - 1
            ? "At or near global advisory cap — double-check before any external comparison."
            : "",
        ].filter(Boolean),
      };
    }
    default:
      return assertNever(mode);
  }
}
