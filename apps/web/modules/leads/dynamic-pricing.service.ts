/**
 * Advisory dynamic multiplier on top of revenue engine base price — bounded, deterministic, no Stripe/checkout mutation.
 */

import type { DynamicPricingSuggestion, LeadPricingContext } from "@/modules/leads/dynamic-pricing.types";

const MAX_MULT = 2;

function clamp(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}

function qualityMultiplier(qualityScore: number): number {
  const q = clamp(qualityScore, 0, 100) / 100;
  // +20% at low quality anchor → +80% at top (1.20 … 1.80)
  return 1.2 + q * 0.6;
}

function demandMultiplier(level: LeadPricingContext["demandLevel"]): number {
  switch (level) {
    case "low":
      return 1;
    case "medium":
      // +10–50% band — use mid-high within band for “medium”
      return 1.22;
    case "high":
      return 1.42;
    default:
      return 1;
  }
}

function brokerInterestMultiplier(level: number): number {
  const x = clamp(level, 0, 100) / 100;
  // +10% … +40%
  return 1.1 + x * 0.3;
}

function conversionNudge(historicalConversion: number | undefined): number {
  if (historicalConversion == null || !Number.isFinite(historicalConversion)) return 1;
  const c = clamp(historicalConversion, 0, 1);
  return 1 + c * 0.1;
}

/**
 * Combine multipliers, cap at 2× base, round suggested dollars.
 */
export function computeDynamicLeadPrice(context: LeadPricingContext): DynamicPricingSuggestion {
  const base = Math.max(0, Math.round(context.basePrice));
  const qm = qualityMultiplier(context.qualityScore);
  const dm = demandMultiplier(context.demandLevel);
  const bm = brokerInterestMultiplier(context.brokerInterestLevel);
  const cm = conversionNudge(context.historicalConversion);

  const raw = qm * dm * bm * cm;
  const priceMultiplier = clamp(raw, 1, MAX_MULT);
  const suggestedPrice = Math.round(clamp(base * priceMultiplier, base, base * MAX_MULT));

  const reason: string[] = [];
  reason.push(
    `Quality layer ×${qm.toFixed(2)} (score ${clamp(context.qualityScore, 0, 100)} → +20–80% band mapped deterministically).`,
  );
  reason.push(`Demand layer ×${dm.toFixed(2)} (${context.demandLevel}).`);
  reason.push(`Broker interest layer ×${bm.toFixed(2)} (level ${clamp(context.brokerInterestLevel, 0, 100)}/100).`);
  if (context.historicalConversion != null && Number.isFinite(context.historicalConversion)) {
    reason.push(`Conversion probability nudge ×${cm.toFixed(2)}.`);
  }
  reason.push(`Capped total multiplier at ×${MAX_MULT} — advisory only; checkout uses standard unlock pricing.`);

  return {
    basePrice: base,
    suggestedPrice,
    priceMultiplier: Math.round(priceMultiplier * 1000) / 1000,
    reason,
    demandLevel: context.demandLevel,
  };
}

export type BrokerInterestInput = {
  /** Count of routing candidates rated good/strong when Smart Routing ran; omit on list views. */
  routingStrongOrGoodCount?: number;
  engagementScore: number;
  highIntent: boolean;
  score: number;
};

/**
 * Map routing + CRM signals to 0–100 for pricing context (deterministic).
 */
export function computeBrokerInterestLevel(input: BrokerInterestInput): number {
  const rc = input.routingStrongOrGoodCount;
  if (rc != null && rc >= 0) {
    return Math.round(clamp(22 + rc * 14 + Math.min(24, input.score * 0.18), 0, 100));
  }
  const es = clamp(typeof input.engagementScore === "number" ? input.engagementScore : 0, 0, 100);
  const sc = clamp(input.score, 0, 100);
  return Math.round(
    clamp((input.highIntent ? 38 : 16) + es * 0.42 + sc * 0.22, 0, 100),
  );
}
