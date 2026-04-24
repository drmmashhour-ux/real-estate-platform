import { playbookTelemetry } from "../playbook-memory.telemetry";

export type PlaybookMonitoringSnapshot = {
  evaluationsCount: number;
  recommendationsCount: number;
  blockedCount: number;
  promotedCount: number;
  demotedCount: number;
  writesCount: number;
  outcomesUpdatedCount: number;
  recalculationsCount: number;
  recalculationFailuresCount: number;
  emptyPlaybooksCount: number;
};

const recalcState = {
  recalculationsCount: 0,
  recalculationFailuresCount: 0,
  emptyPlaybooksCount: 0,
};

/**
 * Counters are in-process (Node runtime); pair with `playbookLog` and host metrics in production.
 */
export function getMonitoringSnapshot(): PlaybookMonitoringSnapshot {
  return { ...playbookTelemetry, ...recalcState };
}

export function resetMonitoringSnapshotForTests(): void {
  playbookTelemetry.evaluationsCount = 0;
  playbookTelemetry.recommendationsCount = 0;
  playbookTelemetry.blockedCount = 0;
  playbookTelemetry.promotedCount = 0;
  playbookTelemetry.demotedCount = 0;
  playbookTelemetry.writesCount = 0;
  playbookTelemetry.outcomesUpdatedCount = 0;
  recalcState.recalculationsCount = 0;
  recalcState.recalculationFailuresCount = 0;
  recalcState.emptyPlaybooksCount = 0;
}

/** @alias resetMonitoringSnapshotForTests */
export function resetForTests(): void {
  resetMonitoringSnapshotForTests();
}

export function incrementRecalculations(): void {
  recalcState.recalculationsCount += 1;
}

export function incrementFailures(): void {
  recalcState.recalculationFailuresCount += 1;
}

export function incrementEmptyPlaybooks(): void {
  recalcState.emptyPlaybooksCount += 1;
}

export function getSnapshot(): PlaybookMonitoringSnapshot {
  return getMonitoringSnapshot();
}
