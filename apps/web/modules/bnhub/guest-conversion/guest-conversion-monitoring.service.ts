/**
 * In-process monitoring for guest conversion summaries — never throws.
 */

import type { BNHubGuestConversionStatus } from "./guest-conversion.types";

const LOG_PREFIX = "[bnhub:guest-conversion]";

export type GuestConversionMonitoringSnapshot = {
  summariesBuilt: number;
  listingsEvaluated: number;
  weakCount: number;
  watchCount: number;
  healthyCount: number;
  strongCount: number;
  frictionSignalsCount: number;
  recommendationsGenerated: number;
  missingDataWarnings: number;
};

const state: GuestConversionMonitoringSnapshot = {
  summariesBuilt: 0,
  listingsEvaluated: 0,
  weakCount: 0,
  watchCount: 0,
  healthyCount: 0,
  strongCount: 0,
  frictionSignalsCount: 0,
  recommendationsGenerated: 0,
  missingDataWarnings: 0,
};

export function getGuestConversionMonitoringSnapshot(): GuestConversionMonitoringSnapshot {
  return { ...state };
}

export function resetGuestConversionMonitoringForTests(): void {
  state.summariesBuilt = 0;
  state.listingsEvaluated = 0;
  state.weakCount = 0;
  state.watchCount = 0;
  state.healthyCount = 0;
  state.strongCount = 0;
  state.frictionSignalsCount = 0;
  state.recommendationsGenerated = 0;
  state.missingDataWarnings = 0;
}

function bumpStatus(s: BNHubGuestConversionStatus): void {
  switch (s) {
    case "weak":
      state.weakCount += 1;
      break;
    case "watch":
      state.watchCount += 1;
      break;
    case "healthy":
      state.healthyCount += 1;
      break;
    case "strong":
      state.strongCount += 1;
      break;
    default:
      break;
  }
}

export function recordGuestConversionSummaryBuilt(input: {
  listingId: string;
  status: BNHubGuestConversionStatus;
  frictionCount: number;
  recommendationCount: number;
  warnings: number;
}): void {
  try {
    state.summariesBuilt += 1;
    state.listingsEvaluated += 1;
    bumpStatus(input.status);
    state.frictionSignalsCount += input.frictionCount;
    state.recommendationsGenerated += input.recommendationCount;
    state.missingDataWarnings += input.warnings;

    // eslint-disable-next-line no-console
    console.log(LOG_PREFIX, "summary_built", {
      listingId: input.listingId.slice(0, 8),
      status: input.status,
      frictionCount: input.frictionCount,
      recommendationCount: input.recommendationCount,
      warnings: input.warnings,
    });
  } catch {
    /* never throw */
  }
}
