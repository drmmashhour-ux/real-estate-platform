/**
 * In-process counters + structured logs for autopilot execution runs.
 */

import { logInfo } from "@/lib/logger";

export type AutopilotMonitoringSnapshot = {
  approvedCount: number;
  attemptedCount: number;
  executedCount: number;
  skippedCount: number;
  failedCount: number;
  unsafeBlockedCount: number;
  duplicateSkippedCount: number;
};

const totals: AutopilotMonitoringSnapshot = {
  approvedCount: 0,
  attemptedCount: 0,
  executedCount: 0,
  skippedCount: 0,
  failedCount: 0,
  unsafeBlockedCount: 0,
  duplicateSkippedCount: 0,
};

export function incrementAutopilotMonitor(field: keyof AutopilotMonitoringSnapshot, by = 1): void {
  totals[field] += by;
}

export function logAutopilotExecutionRun(payload: {
  runId: string;
  phase: "started" | "completed";
  actionIds?: string[];
  summary?: Partial<AutopilotMonitoringSnapshot>;
}): void {
  logInfo("[ai:autopilot:execution]", {
    ...payload,
    counters: { ...totals },
  });
}

export function getAutopilotMonitoringSnapshot(): AutopilotMonitoringSnapshot {
  return { ...totals };
}

export function resetAutopilotMonitoringForTests(): void {
  for (const k of Object.keys(totals) as (keyof AutopilotMonitoringSnapshot)[]) {
    totals[k] = 0;
  }
}
