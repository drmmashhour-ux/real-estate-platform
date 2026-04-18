/**
 * Lead quality V1 — in-process counters; `[leads:quality]` logs.
 */

import { logInfo } from "@/lib/logger";

const LOG = "[leads:quality]";

export type LeadQualityMonitoringSnapshot = {
  summariesBuilt: number;
  highQualityCount: number;
  premiumCount: number;
};

let state: LeadQualityMonitoringSnapshot = {
  summariesBuilt: 0,
  highQualityCount: 0,
  premiumCount: 0,
};

export function getLeadQualityMonitoringSnapshot(): LeadQualityMonitoringSnapshot {
  return { ...state };
}

export function resetLeadQualityMonitoringForTests(): void {
  state = { summariesBuilt: 0, highQualityCount: 0, premiumCount: 0 };
}

export function recordLeadQualitySummaryBuilt(meta: { band: string }): void {
  try {
    state.summariesBuilt += 1;
    if (meta.band === "high" || meta.band === "premium") state.highQualityCount += 1;
    if (meta.band === "premium") state.premiumCount += 1;
    logInfo(`${LOG} summary`, meta);
  } catch {
    /* noop */
  }
}
