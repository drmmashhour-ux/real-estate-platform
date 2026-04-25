/**
 * AI analytics predictions – lead volume, conversion potential, ranking.
 * Deterministic estimates from listing quality.
 */

import { calculateScore, type ListingInput } from "./brain";

export type PredictListingResult = {
  expectedLeadsPerWeek: number;
  conversionPotential: "low" | "medium" | "high";
  rankingPotential: "low" | "medium" | "high";
  confidence: number;
};

export function predictLeadVolume(listing: ListingInput): number {
  const score = calculateScore(listing);
  const base = 2;
  const fromScore = Math.round((score / 100) * 8);
  return Math.max(0, base + fromScore);
}

export function predictConversionPotential(listing: ListingInput): "low" | "medium" | "high" {
  const score = calculateScore(listing);
  if (score >= 70) return "high";
  if (score >= 45) return "medium";
  return "low";
}

export function estimateRankingPotential(listing: ListingInput): "low" | "medium" | "high" {
  const score = calculateScore(listing);
  const title = String(listing?.title ?? "").length;
  const desc = String(listing?.description ?? "").length;
  let rank = score;
  if (title >= 50) rank += 5;
  if (desc >= 200) rank += 5;
  if (rank >= 75) return "high";
  if (rank >= 50) return "medium";
  return "low";
}

export function predictListingAnalytics(listing: ListingInput): PredictListingResult {
  const expectedLeadsPerWeek = predictLeadVolume(listing);
  const conversionPotential = predictConversionPotential(listing);
  const rankingPotential = estimateRankingPotential(listing);
  const score = calculateScore(listing);
  const confidence = Math.min(95, 50 + Math.round(score * 0.4));
  return {
    expectedLeadsPerWeek,
    conversionPotential,
    rankingPotential,
    confidence,
  };
}
