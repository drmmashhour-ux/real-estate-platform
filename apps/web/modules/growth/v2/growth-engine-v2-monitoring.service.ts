/**
 * Growth Engine V2 — bounded in-process telemetry. Prefix `[growth:v2]`. Never throws.
 */

import { logInfo } from "@/lib/logger";

const LOG = "[growth:v2]";

export type GrowthEngineV2MonitoringSnapshot = {
  summariesBuilt: number;
  opportunitiesEmitted: number;
  risksEmitted: number;
  actionsPrioritized: number;
  sparseDataCases: number;
};

let state: GrowthEngineV2MonitoringSnapshot = {
  summariesBuilt: 0,
  opportunitiesEmitted: 0,
  risksEmitted: 0,
  actionsPrioritized: 0,
  sparseDataCases: 0,
};

export function getGrowthEngineV2MonitoringSnapshot(): GrowthEngineV2MonitoringSnapshot {
  return { ...state };
}

export function resetGrowthEngineV2MonitoringForTests(): void {
  state = {
    summariesBuilt: 0,
    opportunitiesEmitted: 0,
    risksEmitted: 0,
    actionsPrioritized: 0,
    sparseDataCases: 0,
  };
}

export function recordGrowthV2SummaryBuilt(meta?: {
  sparse?: boolean;
  oppCount?: number;
  riskCount?: number;
  actionCount?: number;
}): void {
  try {
    state.summariesBuilt += 1;
    if (meta?.sparse) state.sparseDataCases += 1;
    if (meta?.oppCount != null) state.opportunitiesEmitted += meta.oppCount;
    if (meta?.riskCount != null) state.risksEmitted += meta.riskCount;
    if (meta?.actionCount != null) state.actionsPrioritized += meta.actionCount;
    logInfo(`${LOG} summary_built`, meta ?? {});
  } catch {
    /* noop */
  }
}
