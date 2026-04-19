/**
 * Last computed trial outcome — in-process; enables expansion gate + panel reads.
 */

import type { GrowthAutonomyTrialOutcomeSummary } from "./growth-autonomy-trial-results.types";

let lastOutcome: GrowthAutonomyTrialOutcomeSummary | null = null;

export function setGrowthAutonomyTrialOutcomeSummary(summary: GrowthAutonomyTrialOutcomeSummary | null): void {
  lastOutcome = summary;
}

export function getGrowthAutonomyTrialOutcomeSummary(): GrowthAutonomyTrialOutcomeSummary | null {
  return lastOutcome;
}

export function resetGrowthAutonomyTrialOutcomeSummaryForTests(): void {
  lastOutcome = null;
}
