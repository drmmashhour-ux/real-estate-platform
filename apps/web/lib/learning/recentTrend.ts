import type { ListingLearningStats } from "@prisma/client";

/**
 * Uses cached `recentTrendScore` from aggregation (7d vs prior 7d engagement).
 * Fallback neutral when missing.
 */
export function computeRecentTrendScoreFromStats(stats: ListingLearningStats | null): number {
  if (!stats) return 0.5;
  const t = stats.recentTrendScore;
  if (!Number.isFinite(t)) return 0.5;
  return Math.min(1, Math.max(0, t));
}
