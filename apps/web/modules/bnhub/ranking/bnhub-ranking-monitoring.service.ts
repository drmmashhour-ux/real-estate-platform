/**
 * BNHub ranking observability — logging only; never throws.
 */

import { logInfo } from "@/lib/logger";

export type BnhubRankingRunStats = {
  listingsRanked: number;
  avgScore: number;
  strongListings: number;
  weakListings: number;
  missingDataFallbacks: number;
};

export function recordBnhubRankingRun(stats: BnhubRankingRunStats): void {
  try {
    logInfo("[bnhub:ranking]", {
      listingsRanked: stats.listingsRanked,
      avgScore: stats.avgScore,
      strongListings: stats.strongListings,
      weakListings: stats.weakListings,
      missingDataFallbacks: stats.missingDataFallbacks,
    });
  } catch {
    /* ignore */
  }
}
