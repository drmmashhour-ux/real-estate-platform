/**
 * Team dashboard telemetry — `[broker:team]`. Never throws.
 */

const LOG = "[broker:team]";

type TeamMonState = {
  dashboardViews: number;
  brokerDetailOpens: number;
  insightsGenerated: number;
  riskFlagsHigh: number;
};

const state: TeamMonState = {
  dashboardViews: 0,
  brokerDetailOpens: 0,
  insightsGenerated: 0,
  riskFlagsHigh: 0,
};

function safeLog(message: string, extra?: Record<string, unknown>): void {
  try {
    if (extra && Object.keys(extra).length > 0) {
      console.info(`${LOG} ${message}`, extra);
    } else {
      console.info(`${LOG} ${message}`);
    }
  } catch {
    /* ignore */
  }
}

export function recordBrokerTeamDashboardViewed(meta?: { brokerCount?: number }): void {
  try {
    state.dashboardViews += 1;
    safeLog("dashboard_viewed", meta);
  } catch {
    /* ignore */
  }
}

export function recordBrokerTeamBrokerDetailOpened(brokerId: string): void {
  try {
    state.brokerDetailOpens += 1;
    safeLog("broker_detail_opened", { brokerId });
  } catch {
    /* ignore */
  }
}

export function recordBrokerTeamInsightsGenerated(count: number): void {
  try {
    state.insightsGenerated += count;
    safeLog("insights_generated", { count });
  } catch {
    /* ignore */
  }
}

export function recordBrokerTeamRiskFlag(level: "low" | "medium" | "high"): void {
  try {
    if (level === "high") state.riskFlagsHigh += 1;
    safeLog("risk_assessed", { level });
  } catch {
    /* ignore */
  }
}

/** Test-only reset. */
export function resetBrokerTeamMonitoringForTests(): void {
  state.dashboardViews = 0;
  state.brokerDetailOpens = 0;
  state.insightsGenerated = 0;
  state.riskFlagsHigh = 0;
}

export function getBrokerTeamMonitoringSnapshotForTests(): TeamMonState {
  return { ...state };
}
