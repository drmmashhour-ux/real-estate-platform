/**
 * Broker performance V1 — in-process counters; logs `[broker:performance]`.
 */

import { logInfo } from "@/lib/logger";

const LOG = "[broker:performance]";

export type BrokerPerformanceMonitoringSnapshot = {
  performanceSummariesBuilt: number;
  rankingsBuilt: number;
  strongBrokerCount: number;
  weakBrokerCount: number;
  recommendationsGenerated: number;
  missingDataWarnings: number;
};

let state: BrokerPerformanceMonitoringSnapshot = {
  performanceSummariesBuilt: 0,
  rankingsBuilt: 0,
  strongBrokerCount: 0,
  weakBrokerCount: 0,
  recommendationsGenerated: 0,
  missingDataWarnings: 0,
};

export function getBrokerPerformanceMonitoringSnapshot(): BrokerPerformanceMonitoringSnapshot {
  return { ...state };
}

export function resetBrokerPerformanceMonitoringForTests(): void {
  state = {
    performanceSummariesBuilt: 0,
    rankingsBuilt: 0,
    strongBrokerCount: 0,
    weakBrokerCount: 0,
    recommendationsGenerated: 0,
    missingDataWarnings: 0,
  };
}

export function recordPerformanceSummaryBuilt(meta: {
  band: string;
  weakCount: number;
  recCount: number;
  missingData: boolean;
}): void {
  try {
    state.performanceSummariesBuilt += 1;
    state.recommendationsGenerated += meta.recCount;
    if (meta.missingData) state.missingDataWarnings += 1;
    if (meta.band === "strong") state.strongBrokerCount += 1;
    if (meta.band === "low" || meta.band === "watch") state.weakBrokerCount += 1;
    logInfo(`${LOG} summary`, meta);
  } catch {
    /* noop */
  }
}

export function recordRankingsBuilt(count: number): void {
  try {
    state.rankingsBuilt += 1;
    logInfo(`${LOG} rankings`, { count });
  } catch {
    /* noop */
  }
}
