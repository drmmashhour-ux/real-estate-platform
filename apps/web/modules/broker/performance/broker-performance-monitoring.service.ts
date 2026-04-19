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
  engineSnapshotsBuilt: number;
  leaderboardsGenerated: number;
  insufficientDataCases: number;
  insightsGenerated: number;
};

let state: BrokerPerformanceMonitoringSnapshot = {
  performanceSummariesBuilt: 0,
  rankingsBuilt: 0,
  strongBrokerCount: 0,
  weakBrokerCount: 0,
  recommendationsGenerated: 0,
  missingDataWarnings: 0,
  engineSnapshotsBuilt: 0,
  leaderboardsGenerated: 0,
  insufficientDataCases: 0,
  insightsGenerated: 0,
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
    engineSnapshotsBuilt: 0,
    leaderboardsGenerated: 0,
    insufficientDataCases: 0,
    insightsGenerated: 0,
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

export function recordEngineSnapshotBuilt(meta: {
  band: string;
  confidence: string;
  insufficient: boolean;
}): void {
  try {
    state.engineSnapshotsBuilt += 1;
    if (meta.insufficient) state.insufficientDataCases += 1;
    logInfo(`${LOG} engine_snapshot`, meta);
  } catch {
    /* noop */
  }
}

export function recordLeaderboardGenerated(rowCount: number, insufficientRows: number): void {
  try {
    state.leaderboardsGenerated += 1;
    logInfo(`${LOG} leaderboard`, { rowCount, insufficientRows });
  } catch {
    /* noop */
  }
}

export function recordInsightsGenerated(count: number): void {
  try {
    state.insightsGenerated += count;
    logInfo(`${LOG} insights`, { count });
  } catch {
    /* noop */
  }
}
