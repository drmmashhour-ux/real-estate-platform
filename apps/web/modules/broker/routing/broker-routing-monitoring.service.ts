/**
 * Advisory routing V1 — bounded counters; `[broker:routing]` logs.
 */

import { logInfo } from "@/lib/logger";

const LOG = "[broker:routing]";

export type BrokerRoutingMonitoringSnapshot = {
  routingSummariesBuilt: number;
  candidatesEvaluated: number;
  strongCandidateCount: number;
  weakRoutingCount: number;
  missingDataWarnings: number;
};

let state: BrokerRoutingMonitoringSnapshot = {
  routingSummariesBuilt: 0,
  candidatesEvaluated: 0,
  strongCandidateCount: 0,
  weakRoutingCount: 0,
  missingDataWarnings: 0,
};

export function getBrokerRoutingMonitoringSnapshot(): BrokerRoutingMonitoringSnapshot {
  return { ...state };
}

export function resetBrokerRoutingMonitoringForTests(): void {
  state = {
    routingSummariesBuilt: 0,
    candidatesEvaluated: 0,
    strongCandidateCount: 0,
    weakRoutingCount: 0,
    missingDataWarnings: 0,
  };
}

export function recordRoutingSummaryBuilt(meta: {
  candidateCount: number;
  strongCandidates: number;
  weakTopScore: boolean;
  missingRegion: boolean;
}): void {
  try {
    state.routingSummariesBuilt += 1;
    state.candidatesEvaluated += meta.candidateCount;
    state.strongCandidateCount += meta.strongCandidates;
    if (meta.weakTopScore) state.weakRoutingCount += 1;
    if (meta.missingRegion) state.missingDataWarnings += 1;
    logInfo(`${LOG} summary`, meta);
  } catch {
    /* noop */
  }
}
