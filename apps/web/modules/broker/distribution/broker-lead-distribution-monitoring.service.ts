/**
 * In-process telemetry for lead distribution — `[broker:distribution]`. Never throws.
 */

import { logInfo } from "@/lib/logger";

const LOG = "[broker:distribution]";

export type BrokerLeadDistributionMonitoringSnapshot = {
  recommendationsBuilt: number;
  manualOverrides: number;
  sparseDataCases: number;
  suppressedBrokerCases: number;
};

let state: BrokerLeadDistributionMonitoringSnapshot = {
  recommendationsBuilt: 0,
  manualOverrides: 0,
  sparseDataCases: 0,
  suppressedBrokerCases: 0,
};

export function getBrokerLeadDistributionMonitoringSnapshot(): BrokerLeadDistributionMonitoringSnapshot {
  return { ...state };
}

export function resetBrokerLeadDistributionMonitoringForTests(): void {
  state = {
    recommendationsBuilt: 0,
    manualOverrides: 0,
    sparseDataCases: 0,
    suppressedBrokerCases: 0,
  };
}

export function recordBrokerLeadDistributionDecision(meta: {
  candidateCount: number;
  sparse: boolean;
  suppressed: number;
  hasAssignment: boolean;
}): void {
  try {
    state.recommendationsBuilt += 1;
    if (meta.sparse) state.sparseDataCases += 1;
    if (meta.suppressed > 0) state.suppressedBrokerCases += 1;
    logInfo(`${LOG} recommendation_built`, meta);
  } catch {
    /* noop */
  }
}

export function recordBrokerLeadDistributionOverride(): void {
  try {
    state.manualOverrides += 1;
    logInfo(`${LOG} manual_override`);
  } catch {
    /* noop */
  }
}
