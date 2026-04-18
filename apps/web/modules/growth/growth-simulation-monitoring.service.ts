/**
 * Growth simulation monitoring — never throws.
 */

const LOG_PREFIX = "[growth:simulation]";

export type GrowthSimulationMonitoringState = {
  simulationBuilds: number;
  scenariosGenerated: number;
  considerCount: number;
  cautionCount: number;
  deferCount: number;
  lowConfidenceCount: number;
  missingDataWarnings: number;
};

let state: GrowthSimulationMonitoringState = {
  simulationBuilds: 0,
  scenariosGenerated: 0,
  considerCount: 0,
  cautionCount: 0,
  deferCount: 0,
  lowConfidenceCount: 0,
  missingDataWarnings: 0,
};

export function getGrowthSimulationMonitoringSnapshot(): GrowthSimulationMonitoringState {
  return { ...state };
}

export function resetGrowthSimulationMonitoringForTests(): void {
  state = {
    simulationBuilds: 0,
    scenariosGenerated: 0,
    considerCount: 0,
    cautionCount: 0,
    deferCount: 0,
    lowConfidenceCount: 0,
    missingDataWarnings: 0,
  };
}

export function logGrowthSimulationBuildStarted(): void {
  try {
    console.info(`${LOG_PREFIX} build started`);
  } catch {
    /* noop */
  }
}

export function recordGrowthSimulationBuild(args: {
  baselineStatus?: string;
  scenarioCount: number;
  topRecommendation?: "consider" | "caution" | "defer";
  missingDataWarningCount: number;
  lowConfidenceScenarioCount: number;
  consider: number;
  caution: number;
  defer: number;
}): void {
  try {
    state.simulationBuilds += 1;
    state.scenariosGenerated += args.scenarioCount;
    state.missingDataWarnings += args.missingDataWarningCount;
    state.lowConfidenceCount += args.lowConfidenceScenarioCount;
    state.considerCount += args.consider;
    state.cautionCount += args.caution;
    state.deferCount += args.defer;
    console.info(
      `${LOG_PREFIX} build completed baselineStatus=${args.baselineStatus ?? "(none)"} scenarios=${args.scenarioCount} top=${args.topRecommendation ?? "(none)"} warnings=${args.missingDataWarningCount}`,
    );
  } catch {
    /* noop */
  }
}
