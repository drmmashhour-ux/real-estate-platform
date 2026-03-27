/** Boost or penalize routing score from observable expert performance (retention / quality). */
export function expertRevenuePerformanceDelta(params: {
  rating: number;
  reviewCount: number;
  totalDeals: number;
}): number {
  const { rating, reviewCount, totalDeals } = params;
  if (reviewCount >= 3 && rating < 3.4) return -5;
  if (reviewCount >= 2 && totalDeals < 3 && rating < 3.8) return -3;
  if (reviewCount >= 6 && rating >= 4.7 && totalDeals >= 15) return 4;
  if (totalDeals >= 20 && rating >= 4.2) return 2;
  return 0;
}

/** Ranking score for smart lead routing (higher = preferred). */
export function mortgageDistributionScore(params: {
  rating: number;
  adminRatingBoost: number;
  totalDeals: number;
  priorityWeight: number;
  reviewCount?: number;
}): number {
  const { rating, adminRatingBoost, totalDeals, priorityWeight, reviewCount = 0 } = params;
  const base = rating + adminRatingBoost + totalDeals * 0.1 + priorityWeight * 0.5;
  return base + expertRevenuePerformanceDelta({ rating, reviewCount, totalDeals });
}
