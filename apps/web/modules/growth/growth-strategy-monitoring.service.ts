/**
 * In-memory monitoring for growth strategy builds — never throws.
 */

export type GrowthStrategyMonitoringState = {
  strategyBuilds: number;
  weakCount: number;
  watchCount: number;
  healthyCount: number;
  strongCount: number;
  prioritiesGenerated: number;
  experimentsGenerated: number;
  roadmapItemsGenerated: number;
  missingDataWarnings: number;
};

const LOG_PREFIX = "[growth:strategy]";

let state: GrowthStrategyMonitoringState = {
  strategyBuilds: 0,
  weakCount: 0,
  watchCount: 0,
  healthyCount: 0,
  strongCount: 0,
  prioritiesGenerated: 0,
  experimentsGenerated: 0,
  roadmapItemsGenerated: 0,
  missingDataWarnings: 0,
};

export function getGrowthStrategyMonitoringSnapshot(): GrowthStrategyMonitoringState {
  return { ...state };
}

export function resetGrowthStrategyMonitoringForTests(): void {
  state = {
    strategyBuilds: 0,
    weakCount: 0,
    watchCount: 0,
    healthyCount: 0,
    strongCount: 0,
    prioritiesGenerated: 0,
    experimentsGenerated: 0,
    roadmapItemsGenerated: 0,
    missingDataWarnings: 0,
  };
}

export function logGrowthStrategyBuildStarted(): void {
  try {
    console.info(`${LOG_PREFIX} build started`);
  } catch {
    /* noop */
  }
}

export function recordGrowthStrategyBuild(args: {
  status: "weak" | "watch" | "healthy" | "strong";
  topPriority?: string;
  priorityCount: number;
  experimentCount: number;
  roadmapCount: number;
  missingDataWarningCount: number;
}): void {
  try {
    state.strategyBuilds += 1;
    state.prioritiesGenerated += args.priorityCount;
    state.experimentsGenerated += args.experimentCount;
    state.roadmapItemsGenerated += args.roadmapCount;
    state.missingDataWarnings += args.missingDataWarningCount;
    if (args.status === "weak") state.weakCount += 1;
    else if (args.status === "watch") state.watchCount += 1;
    else if (args.status === "healthy") state.healthyCount += 1;
    else state.strongCount += 1;

    console.info(
      `${LOG_PREFIX} build completed status=${args.status} topPriority=${args.topPriority ?? "(none)"} priorities=${args.priorityCount} experiments=${args.experimentCount} roadmap=${args.roadmapCount} warnings=${args.missingDataWarningCount}`,
    );
  } catch {
    /* never throw */
  }
}
