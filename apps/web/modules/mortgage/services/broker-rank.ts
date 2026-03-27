/**
 * Composite score for lead assignment: rating, response speed, volume.
 * Higher is better. Used to sort eligible brokers before fairness tie-breaks.
 */
export function computeBrokerRankScore(b: {
  rating: number;
  totalReviews: number;
  responseTimeAvg: number | null;
  responseTimeSamples: number;
  totalLeadsHandled: number;
}): number {
  const ratingNorm = Math.min(5, Math.max(0, b.rating)) / 5;
  const hours = b.responseTimeAvg ?? 48;
  const respScore = Math.max(0, 1 - Math.min(hours, 72) / 72);
  const volume = Math.min(1, Math.log10(1 + Math.max(0, b.totalLeadsHandled)) / 2.5);
  const reviewTrust = b.totalReviews >= 3 ? 0.05 : b.totalReviews >= 1 ? 0.02 : 0;
  return ratingNorm * 0.45 + respScore * 0.35 + volume * 0.18 + reviewTrust;
}
