/**
 * In-process incentives telemetry — `[broker:incentives]`. Never throws.
 */

import { logInfo } from "@/lib/logger";

const LOG = "[broker:incentives]";

export type BrokerIncentivesMonitoringSnapshot = {
  summariesBuilt: number;
  badgesUnlocked: number;
  streaksUpdated: number;
  milestonesAchieved: number;
};

let state: BrokerIncentivesMonitoringSnapshot = {
  summariesBuilt: 0,
  badgesUnlocked: 0,
  streaksUpdated: 0,
  milestonesAchieved: 0,
};

export function getBrokerIncentivesMonitoringSnapshot(): BrokerIncentivesMonitoringSnapshot {
  return { ...state };
}

export function resetBrokerIncentivesMonitoringForTests(): void {
  state = {
    summariesBuilt: 0,
    badgesUnlocked: 0,
    streaksUpdated: 0,
    milestonesAchieved: 0,
  };
}

export function recordIncentiveSummaryBuilt(meta: { badgeCount: number; streakCount: number; milestoneAchieved: number }): void {
  try {
    state.summariesBuilt += 1;
    state.badgesUnlocked += meta.badgeCount;
    state.streaksUpdated += meta.streakCount;
    state.milestonesAchieved += meta.milestoneAchieved;
    logInfo(`${LOG} summary`, meta);
  } catch {
    /* noop */
  }
}
