import type { PricingInput, PricingOutput } from "../models/index.js";

/**
 * AI pricing recommendation from location, type, season, demand, rating, comparables.
 * Rule-based; can be replaced by ML model or LLM.
 */
export function getPricingRecommendation(input: PricingInput): PricingOutput {
  const nearby = input.nearbyListingPrices ?? [];
  const avgNearby =
    nearby.length > 0 ? nearby.reduce((a, b) => a + b, 0) / nearby.length : 12000; // default $120/night
  const demandMultiplier =
    input.demandLevel === "high" ? 1.2 : input.demandLevel === "low" ? 0.85 : 1;
  const seasonMultiplier = input.season === "peak" ? 1.15 : input.season === "low" ? 0.9 : 1;
  const ratingBonus = (input.listingRating ?? 0) >= 4.5 ? 1.05 : 1;

  let recommended = Math.round(avgNearby * demandMultiplier * seasonMultiplier * ratingBonus);
  if (recommended < 5000) recommended = 5000; // min $50
  const rangePct = 0.15;
  const minCents = Math.round(recommended * (1 - rangePct));
  const maxCents = Math.round(recommended * (1 + rangePct));

  const factors: string[] = [];
  if (nearby.length > 0) factors.push(`Based on ${nearby.length} comparable listings`);
  factors.push(`Demand: ${input.demandLevel ?? "medium"}`);
  if (input.season) factors.push(`Season: ${input.season}`);
  if (input.listingRating != null) factors.push(`Rating: ${input.listingRating}`);
  factors.push(`Location: ${input.location}`);

  let confidenceLevel: PricingOutput["confidenceLevel"] = "medium";
  if (nearby.length >= 5 && input.demandLevel) confidenceLevel = "high";
  else if (nearby.length === 0) confidenceLevel = "low";

  return {
    recommendedNightlyCents: recommended,
    suggestedMinCents: minCents,
    suggestedMaxCents: maxCents,
    confidenceLevel,
    factors,
  };
}
