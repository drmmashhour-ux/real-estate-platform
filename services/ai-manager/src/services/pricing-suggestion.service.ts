import type { PricingSuggestionInput, PricingSuggestionOutput } from "../models/index.js";

/**
 * Pricing recommendation from location, season, demand, comparables, reviews.
 */
export function getPricingSuggestion(input: PricingSuggestionInput): PricingSuggestionOutput {
  const similar = input.similarListings ?? [];
  const avgCents =
    similar.length > 0
      ? Math.round(similar.reduce((s, l) => s + l.nightPriceCents, 0) / similar.length)
      : 15000; // default $150/night

  const demandMult =
    input.demandLevel === "high" ? 1.2 : input.demandLevel === "low" ? 0.85 : 1;
  const seasonMult = input.season === "peak" ? 1.15 : input.season === "low" ? 0.9 : 1;
  const ratingBonus = (input.avgRating ?? 0) >= 4.5 ? 1.08 : 1;
  const reviewBonus = (input.reviewCount ?? 0) >= 10 ? 1.05 : 1;

  let recommended = Math.round(avgCents * demandMult * seasonMult * ratingBonus * reviewBonus);
  if (recommended < 5000) recommended = 5000;
  const rangePct = 0.12;
  const minCents = Math.round(recommended * (1 - rangePct));
  const maxCents = Math.round(recommended * (1 + rangePct));

  const factors: string[] = [];
  factors.push(`Location: ${input.location}`);
  if (similar.length > 0) factors.push(`Based on ${similar.length} similar listings`);
  factors.push(`Demand: ${input.demandLevel ?? "medium"}`);
  if (input.season) factors.push(`Season: ${input.season}`);
  if (input.avgRating != null) factors.push(`Avg rating: ${input.avgRating}`);
  if (input.currentPriceCents != null) {
    const diff = ((recommended - input.currentPriceCents) / input.currentPriceCents) * 100;
    factors.push(`Current price ${diff >= 0 ? "+" : ""}${diff.toFixed(0)}% vs recommended`);
  }

  let confidence: PricingSuggestionOutput["confidence"] = "medium";
  if (similar.length >= 5 && input.demandLevel) confidence = "high";
  else if (similar.length === 0) confidence = "low";

  return {
    recommendedNightlyCents: recommended,
    priceRangeMinCents: minCents,
    priceRangeMaxCents: maxCents,
    factors,
    confidence,
  };
}
