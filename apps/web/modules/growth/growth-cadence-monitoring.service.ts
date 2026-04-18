/**
 * Cadence build monitoring — never throws.
 */

const LOG_PREFIX = "[growth:cadence]";

export type GrowthCadenceMonitoringState = {
  cadenceBuilds: number;
  weakCount: number;
  watchCount: number;
  healthyCount: number;
  strongCount: number;
  checklistItemsGenerated: number;
  risksDetected: number;
  missingDataWarnings: number;
};

let state: GrowthCadenceMonitoringState = {
  cadenceBuilds: 0,
  weakCount: 0,
  watchCount: 0,
  healthyCount: 0,
  strongCount: 0,
  checklistItemsGenerated: 0,
  risksDetected: 0,
  missingDataWarnings: 0,
};

export function getGrowthCadenceMonitoringSnapshot(): GrowthCadenceMonitoringState {
  return { ...state };
}

export function resetGrowthCadenceMonitoringForTests(): void {
  state = {
    cadenceBuilds: 0,
    weakCount: 0,
    watchCount: 0,
    healthyCount: 0,
    strongCount: 0,
    checklistItemsGenerated: 0,
    risksDetected: 0,
    missingDataWarnings: 0,
  };
}

export function logGrowthCadenceBuildStarted(): void {
  try {
    console.info(`${LOG_PREFIX} build started`);
  } catch {
    /* noop */
  }
}

export function recordGrowthCadenceBuild(args: {
  status: "weak" | "watch" | "healthy" | "strong";
  focus?: string;
  checklistCount: number;
  riskCount: number;
  missingDataWarningCount: number;
}): void {
  try {
    state.cadenceBuilds += 1;
    state.checklistItemsGenerated += args.checklistCount;
    state.risksDetected += args.riskCount;
    state.missingDataWarnings += args.missingDataWarningCount;
    if (args.status === "weak") state.weakCount += 1;
    else if (args.status === "watch") state.watchCount += 1;
    else if (args.status === "healthy") state.healthyCount += 1;
    else state.strongCount += 1;
    console.info(
      `${LOG_PREFIX} build completed status=${args.status} focus=${args.focus ?? "(none)"} checklist=${args.checklistCount} risks=${args.riskCount} warnings=${args.missingDataWarningCount}`,
    );
  } catch {
    /* noop */
  }
}
