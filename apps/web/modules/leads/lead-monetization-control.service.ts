/**
 * Unified operator readout — combines quality, demand, dynamic pricing, and revenue base without mutating pricing engines.
 */

import type { DynamicPricingSuggestion } from "@/modules/leads/dynamic-pricing.types";
import type { LeadQualitySummary } from "@/modules/leads/lead-quality.types";
import type { LeadPricingResult } from "@/modules/revenue/lead-pricing.service";
import type { LeadMonetizationControlSummary } from "@/modules/leads/lead-monetization-control.types";
import { evaluateMonetizationConfidence } from "@/modules/leads/lead-monetization-confidence.service";
import {
  buildLeadMonetizationExplanation,
  buildLeadMonetizationReasons,
} from "@/modules/leads/lead-monetization-explainer.service";
import { recordLeadMonetizationControlSummary } from "@/modules/leads/lead-monetization-control-monitoring.service";

export type BuildLeadMonetizationControlSummaryInput = {
  leadId: string;
  leadPricing: LeadPricingResult | null | undefined;
  leadQuality: LeadQualitySummary | null | undefined;
  dynamicPricing: DynamicPricingSuggestion | null | undefined;
  demandLevel: "low" | "medium" | "high";
  demandScore: number;
  brokerInterestLevel: number;
  interactionCount: number;
  regionPeerLeadCount: number;
  conversionProbability: number | null | undefined;
};

function clampPrice(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n);
}

/**
 * Single bundle for admin UI — precedence: dynamic advisory > quality advisory > base reference only.
 */
export function buildLeadMonetizationControlSummary(
  input: BuildLeadMonetizationControlSummaryInput,
): LeadMonetizationControlSummary {
  const basePrice = clampPrice(input.leadPricing?.leadPrice ?? 0);

  let priceSourceMode: LeadMonetizationControlSummary["priceSourceMode"] = "base_only";
  let suggestedPrice = basePrice;

  if (input.dynamicPricing) {
    priceSourceMode = "dynamic_advisory";
    suggestedPrice = clampPrice(input.dynamicPricing.suggestedPrice);
  } else if (input.leadQuality) {
    priceSourceMode = "quality_advisory";
    suggestedPrice = clampPrice(input.leadQuality.suggestedPrice);
  }

  const confidenceCtx = {
    leadQuality: input.leadQuality,
    dynamicPricing: input.dynamicPricing,
    demandScore: input.demandScore,
    brokerInterestLevel: input.brokerInterestLevel,
    interactionCount: input.interactionCount,
    regionPeerLeadCount: input.regionPeerLeadCount,
    hasConversionProbability:
      input.conversionProbability != null && Number.isFinite(input.conversionProbability),
  };

  const { level: confidenceLevel, missingSignals } = evaluateMonetizationConfidence(confidenceCtx);

  const warnings: string[] = [];
  if (confidenceLevel === "low") {
    warnings.push("Confidence: low — prefer conservative positioning; several signals are thin or absent.");
  }
  if (input.dynamicPricing && input.dynamicPricing.priceMultiplier >= 1.95) {
    warnings.push("Advisory multiplier is near the configured cap — double-check before external messaging.");
  }
  if (priceSourceMode === "base_only") {
    warnings.push("No layered advisory price — only the revenue-engine base is shown as the unified figure.");
  }

  const reasons = buildLeadMonetizationReasons({
    mode: priceSourceMode,
    basePrice,
    suggestedPrice,
    leadQuality: input.leadQuality,
    dynamicPricing: input.dynamicPricing,
    demandLevel: input.demandLevel,
    demandScore: input.demandScore,
    brokerInterestLevel: input.brokerInterestLevel,
    confidenceLevel,
  });

  const explanation = buildLeadMonetizationExplanation({
    mode: priceSourceMode,
    suggestedPrice,
    basePrice,
    confidenceLevel,
  });

  recordLeadMonetizationControlSummary({
    mode: priceSourceMode,
    confidence: confidenceLevel,
    sparseWarnings: missingSignals.length,
  });

  return {
    leadId: input.leadId,
    basePrice,
    qualityBand: input.leadQuality?.band,
    qualityScore: input.leadQuality?.score,
    demandLevel: input.demandLevel,
    demandScore: input.demandScore,
    brokerInterestLevel: input.brokerInterestLevel,
    suggestedPrice,
    priceSourceMode,
    confidenceLevel,
    reasons,
    warnings,
    missingSignals,
    explanation,
  };
}
