import type { GrowthPolicyDomain, GrowthPolicyResult } from "./growth-policy.types";

const LOG_PREFIX = "[growth:policy]";

type MonitoringState = {
  evaluationsCount: number;
  warningsCount: number;
  criticalCount: number;
  infoCount: number;
  domainsTriggered: Record<string, number>;
};

const state: MonitoringState = {
  evaluationsCount: 0,
  warningsCount: 0,
  criticalCount: 0,
  infoCount: 0,
  domainsTriggered: {},
};

function emit(payload: Record<string, unknown>): void {
  try {
    const line = `${LOG_PREFIX} ${JSON.stringify(payload)}`;
    if (typeof console !== "undefined" && console.info) {
      console.info(line);
    }
  } catch {
    /* never throw */
  }
}

function bumpDomain(domain: GrowthPolicyDomain): void {
  const k = domain;
  state.domainsTriggered[k] = (state.domainsTriggered[k] ?? 0) + 1;
}

export function recordGrowthPolicyEvaluation(results: GrowthPolicyResult[]): void {
  try {
    state.evaluationsCount += 1;
    for (const r of results) {
      if (r.severity === "warning") state.warningsCount += 1;
      if (r.severity === "critical") state.criticalCount += 1;
      if (r.severity === "info") state.infoCount += 1;
      bumpDomain(r.domain);
    }
    emit({
      event: "evaluate",
      evaluationsCount: state.evaluationsCount,
      resultCount: results.length,
      warningsCount: state.warningsCount,
      criticalCount: state.criticalCount,
      infoCount: state.infoCount,
      domainsTriggered: { ...state.domainsTriggered },
    });
  } catch {
    /* never throw */
  }
}

export function getGrowthPolicyMonitoringSnapshot(): MonitoringState {
  return {
    evaluationsCount: state.evaluationsCount,
    warningsCount: state.warningsCount,
    criticalCount: state.criticalCount,
    infoCount: state.infoCount,
    domainsTriggered: { ...state.domainsTriggered },
  };
}

export function resetGrowthPolicyMonitoringForTests(): void {
  state.evaluationsCount = 0;
  state.warningsCount = 0;
  state.criticalCount = 0;
  state.infoCount = 0;
  state.domainsTriggered = {};
}
