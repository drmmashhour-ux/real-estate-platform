/**
 * Host performance dashboard observability — in-memory counters; never throws.
 */

import { logInfo } from "@/lib/logger";

type Snapshot = {
  summariesBuilt: number;
  listingsEvaluated: number;
  weakListingsCount: number;
  healthyListingsCount: number;
  strongListingsCount: number;
  watchListingsCount: number;
  recommendationsGenerated: number;
  missingDataWarnings: number;
};

let state: Snapshot = {
  summariesBuilt: 0,
  listingsEvaluated: 0,
  weakListingsCount: 0,
  healthyListingsCount: 0,
  strongListingsCount: 0,
  watchListingsCount: 0,
  recommendationsGenerated: 0,
  missingDataWarnings: 0,
};

export function recordHostPerformanceSummaryBuilt(stats: {
  listings: number;
  weak: number;
  healthy: number;
  strong: number;
  watch: number;
  recommendations: number;
  missingDataWarnings: number;
}): void {
  try {
    state.summariesBuilt += 1;
    state.listingsEvaluated += stats.listings;
    state.weakListingsCount += stats.weak;
    state.healthyListingsCount += stats.healthy;
    state.strongListingsCount += stats.strong;
    state.watchListingsCount += stats.watch;
    state.recommendationsGenerated += stats.recommendations;
    state.missingDataWarnings += stats.missingDataWarnings;
    logInfo("[bnhub:host-performance]", {
      summariesBuilt: state.summariesBuilt,
      listingsEvaluated: stats.listings,
      weakListings: stats.weak,
      healthyListings: stats.healthy,
      strongListings: stats.strong,
      watchListings: stats.watch,
      recommendationsGenerated: stats.recommendations,
      missingDataWarnings: stats.missingDataWarnings,
    });
  } catch {
    /* never throw */
  }
}

export function getHostPerformanceMonitoringSnapshot(): Readonly<Snapshot> & { createdAt: string } {
  return { ...state, createdAt: new Date().toISOString() };
}

export function resetHostPerformanceMonitoringForTests(): void {
  state = {
    summariesBuilt: 0,
    listingsEvaluated: 0,
    weakListingsCount: 0,
    healthyListingsCount: 0,
    strongListingsCount: 0,
    watchListingsCount: 0,
    recommendationsGenerated: 0,
    missingDataWarnings: 0,
  };
}
