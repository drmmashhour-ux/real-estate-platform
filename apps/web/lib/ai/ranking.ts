import {
  getLearningWeight,
  MAX_LEARNING_WEIGHT,
  MIN_LEARNING_WEIGHT,
} from "@/lib/ab/learn";

export { MAX_LEARNING_WEIGHT as MAX_WEIGHT, MIN_LEARNING_WEIGHT as MIN_WEIGHT };

export type LearnRankedListing = {
  views?: number;
  price?: number;
  marketPrice?: number | null;
} & Record<string, unknown>;

/**
 * Ranks by views × learned `booking_cta_weight` (from `learning_metrics`) plus a small “deal” bonus.
 * **Additive** to the product `rankListings` in `modules/search` — use when you need a quick learning-weighted list.
 */
export async function rankListings(listings: LearnRankedListing[]) {
  const weight = await getLearningWeight("booking_cta_weight", 1);
  return [...listings].sort((a, b) => {
    const scoreA = scoreOne(a, weight);
    const scoreB = scoreOne(b, weight);
    return scoreB - scoreA;
  });
}

function scoreOne(row: LearnRankedListing, weight: number) {
  const v = Math.max(0, Number(row.views) || 0);
  const under =
    row.marketPrice != null &&
    row.price != null &&
    Number.isFinite(row.price) &&
    Number.isFinite(row.marketPrice) &&
    row.price < row.marketPrice
      ? 50
      : 0;
  return v * weight + under;
}
