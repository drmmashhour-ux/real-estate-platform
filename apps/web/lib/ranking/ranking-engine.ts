/**
 * Airbnb-style **relative** listing score from normalized inputs (0–1 each).
 * Consumers sort by `score` descending; tune weights per market in config later.
 */

export type RankingFeatures = {
  bookingsNorm: number;
  viewsNorm: number;
  conversionRateNorm: number;
  hostResponseSpeedNorm: number;
  contentQualityNorm: number;
  /** Active paid featured / promotion window — applies score multiplier. */
  featuredPlacementActive?: boolean;
};

const W_BOOKINGS = 0.4;
const W_VIEWS = 0.2;
const W_CONV = 0.2;
const W_RESPONSE = 0.1;
const W_CONTENT = 0.1;
const FEATURED_SCORE_MULTIPLIER = 1.5;

export function computeListingRankingScore(f: RankingFeatures): number {
  const clamp = (n: number) => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
  const b = clamp(f.bookingsNorm);
  const v = clamp(f.viewsNorm);
  const c = clamp(f.conversionRateNorm);
  const r = clamp(f.hostResponseSpeedNorm);
  const q = clamp(f.contentQualityNorm);
  let score = b * W_BOOKINGS + v * W_VIEWS + c * W_CONV + r * W_RESPONSE + q * W_CONTENT;
  if (f.featuredPlacementActive) {
    score *= FEATURED_SCORE_MULTIPLIER;
  }
  return score;
}

export function rankListings<T extends { id: string; features: RankingFeatures }>(rows: T[]): Array<T & { score: number }> {
  return rows
    .map((row) => ({ ...row, score: computeListingRankingScore(row.features) }))
    .sort((a, b) => b.score - a.score);
}
