import { logInfo } from "@/lib/logger";

const LOG = "[revenue:dashboard]";

type State = {
  dashboardBuilds: number;
  alertsGenerated: number;
  missingDataWarnings: number;
  zeroRevenueDaysDetected: number;
  weakUnlockRateDetected: number;
};

const state: State = {
  dashboardBuilds: 0,
  alertsGenerated: 0,
  missingDataWarnings: 0,
  zeroRevenueDaysDetected: 0,
  weakUnlockRateDetected: 0,
};

function emit(payload: Record<string, unknown>): void {
  try {
    logInfo(LOG, payload);
  } catch {
    /* never throw */
  }
}

export function recordRevenueDashboardBuild(meta?: Record<string, unknown>): void {
  state.dashboardBuilds += 1;
  emit({ event: "build", dashboardBuilds: state.dashboardBuilds, ...meta });
}

export function recordRevenueDashboardAlertsGenerated(n: number): void {
  state.alertsGenerated += n;
  emit({ event: "alerts", count: n, alertsGenerated: state.alertsGenerated });
}

export function recordMissingDataWarning(): void {
  state.missingDataWarnings += 1;
  emit({ event: "missing_data", missingDataWarnings: state.missingDataWarnings });
}

export function recordZeroRevenueDayDetected(): void {
  state.zeroRevenueDaysDetected += 1;
  emit({ event: "zero_revenue_day", zeroRevenueDaysDetected: state.zeroRevenueDaysDetected });
}

export function recordWeakUnlockRateDetected(): void {
  state.weakUnlockRateDetected += 1;
  emit({ event: "weak_unlock", weakUnlockRateDetected: state.weakUnlockRateDetected });
}

export function getRevenueDashboardMonitoringSnapshot(): State {
  return { ...state };
}

export function resetRevenueDashboardMonitoringForTests(): void {
  state.dashboardBuilds = 0;
  state.alertsGenerated = 0;
  state.missingDataWarnings = 0;
  state.zeroRevenueDaysDetected = 0;
  state.weakUnlockRateDetected = 0;
}
