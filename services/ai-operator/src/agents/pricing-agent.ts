import type { PricingInput, PricingOutput } from "../models/agents.js";

export function runPricingAgent(input: PricingInput): PricingOutput {
  const nearby = input.nearbyPricesCents ?? [];
  const avgCents = nearby.length > 0
    ? Math.round(nearby.reduce((a, b) => a + b, 0) / nearby.length)
    : 12000;
  const demandMult = input.demandLevel === "high" ? 1.2 : input.demandLevel === "low" ? 0.85 : 1;
  const seasonMult = input.season === "peak" ? 1.15 : input.season === "low" ? 0.9 : 1;
  const qualityMult = (input.listingQualityScore ?? 70) / 80;
  const ratingMult = (input.avgRating ?? 4) >= 4.5 ? 1.08 : 1;
  let recommended = Math.round(avgCents * demandMult * seasonMult * Math.max(0.8, qualityMult) * ratingMult);
  if (recommended < 5000) recommended = 5000;
  const rangePct = 0.12;
  const minCents = Math.round(recommended * (1 - rangePct));
  const maxCents = Math.round(recommended * (1 + rangePct));

  const reasonCodes: string[] = [`demand:${input.demandLevel ?? "medium"}`, `location:${input.location}`];
  if (nearby.length > 0) reasonCodes.push(`comparables:${nearby.length}`);
  const confidence = nearby.length >= 5 ? 0.85 : nearby.length >= 1 ? 0.7 : 0.5;
  const demandLabel = input.demandLevel ?? "medium";

  const specialPricingPeriods =
    input.season === "peak"
      ? [{ start: new Date().toISOString().slice(0, 10), end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), multiplier: 1.1 }]
      : undefined;

  return {
    recommendedNightlyCents: recommended,
    priceRangeMinCents: minCents,
    priceRangeMaxCents: maxCents,
    demandLabel,
    suggestedMinStayNights: input.demandLevel === "high" ? 2 : undefined,
    specialPricingPeriods,
    confidenceScore: confidence,
    recommendedAction: "suggest_price_update",
    reasonCodes,
    escalateToHuman: false,
  };
}
