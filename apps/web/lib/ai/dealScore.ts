/**
 * User-facing “deal” badge from a 0–100 score.
 * Order 119 — wire score from `computeListingDealScoreV1` (or a future model).
 */
export function getDealLabel(score: number) {
  if (score > 80) return "🔥 Great deal";
  if (score > 60) return "👍 Good price";
  return null;
}

/**
 * V1 heuristic for highlight only — not a market appraisal.
 * Favors listings with more confirmed paid stays and a lower demo nightly price band.
 * Replace with model-based scores when available.
 */
export function computeListingDealScoreV1(input: {
  price: number;
  confirmedBookingCount: number;
}): number {
  const demand = Math.min(40, input.confirmedBookingCount * 5);
  const valueHint = input.price > 0 && input.price < 300 ? 20 : 10;
  return Math.min(100, 35 + demand + valueHint);
}
