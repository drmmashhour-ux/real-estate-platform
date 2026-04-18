/**
 * Advisory confidence for monetization readout — no fake certainty; sparse inputs → low confidence.
 */

import type { DynamicPricingSuggestion } from "@/modules/leads/dynamic-pricing.types";
import type { LeadQualitySummary } from "@/modules/leads/lead-quality.types";
import type { LeadMonetizationConfidenceLevel } from "@/modules/leads/lead-monetization-control.types";

export type MonetizationConfidenceContext = {
  leadQuality: LeadQualitySummary | null | undefined;
  dynamicPricing: DynamicPricingSuggestion | null | undefined;
  /** 0–100 from `computeLeadDemandScore`. */
  demandScore: number;
  brokerInterestLevel: number;
  interactionCount: number;
  regionPeerLeadCount: number;
  hasConversionProbability: boolean;
};

function clamp(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Richness score 0–100 (higher = more signals observed).
 */
export function computeSignalRichness(ctx: MonetizationConfidenceContext): number {
  let r = 0;
  if (ctx.leadQuality) r += 28;
  if (ctx.dynamicPricing) r += 28;
  r += clamp(ctx.demandScore * 0.22, 0, 22);
  r += clamp(ctx.brokerInterestLevel * 0.12, 0, 12);
  if (ctx.interactionCount >= 3) r += 8;
  else if (ctx.interactionCount >= 1) r += 4;
  if (ctx.regionPeerLeadCount > 0) r += 6;
  if (ctx.hasConversionProbability) r += 5;
  return Math.round(clamp(r, 0, 100));
}

export function evaluateMonetizationConfidence(ctx: MonetizationConfidenceContext): {
  level: LeadMonetizationConfidenceLevel;
  richness: number;
  missingSignals: string[];
} {
  const missingSignals: string[] = [];
  if (!ctx.leadQuality) missingSignals.push("Lead quality model was not run (flag off or unavailable).");
  if (!ctx.dynamicPricing) missingSignals.push("Dynamic pricing layer was not run (flag off or unavailable).");
  if (ctx.interactionCount === 0) missingSignals.push("No CRM/timeline interactions recorded yet.");
  if (ctx.regionPeerLeadCount === 0 && ctx.dynamicPricing == null) {
    missingSignals.push("Limited regional cohort signal for this snapshot.");
  }
  if (!ctx.hasConversionProbability) missingSignals.push("No stored conversion probability on the lead row.");

  const richness = computeSignalRichness(ctx);
  const align =
    (ctx.leadQuality ? 1 : 0) +
    (ctx.dynamicPricing ? 1 : 0) +
    (ctx.demandScore >= 55 ? 1 : 0) +
    (ctx.brokerInterestLevel >= 55 ? 1 : 0);

  let level: LeadMonetizationConfidenceLevel = "medium";
  if (richness < 38 || align <= 1) level = "low";
  else if (richness >= 72 && align >= 3 && ctx.dynamicPricing != null) level = "high";

  return { level, richness, missingSignals };
}
