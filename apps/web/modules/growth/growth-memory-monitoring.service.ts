/**
 * Growth memory monitoring — never throws.
 */

const LOG_PREFIX = "[growth:memory]";

export type GrowthMemoryMonitoringState = {
  memoryBuilds: number;
  entriesExtracted: number;
  recurringBlockersCount: number;
  winningPatternsCount: number;
  lessonsCount: number;
  missingDataWarnings: number;
};

let state: GrowthMemoryMonitoringState = {
  memoryBuilds: 0,
  entriesExtracted: 0,
  recurringBlockersCount: 0,
  winningPatternsCount: 0,
  lessonsCount: 0,
  missingDataWarnings: 0,
};

export function getGrowthMemoryMonitoringSnapshot(): GrowthMemoryMonitoringState {
  return { ...state };
}

export function resetGrowthMemoryMonitoringForTests(): void {
  state = {
    memoryBuilds: 0,
    entriesExtracted: 0,
    recurringBlockersCount: 0,
    winningPatternsCount: 0,
    lessonsCount: 0,
    missingDataWarnings: 0,
  };
}

export function logGrowthMemoryBuildStarted(): void {
  try {
    console.info(`${LOG_PREFIX} build started`);
  } catch {
    /* noop */
  }
}

export function recordGrowthMemoryBuild(args: {
  entriesExtracted: number;
  recurringBlockers: number;
  winningPatterns: number;
  lessonsCount: number;
  missingDataWarningCount: number;
}): void {
  try {
    state.memoryBuilds += 1;
    state.entriesExtracted += args.entriesExtracted;
    state.recurringBlockersCount += args.recurringBlockers;
    state.winningPatternsCount += args.winningPatterns;
    state.lessonsCount += args.lessonsCount;
    state.missingDataWarnings += args.missingDataWarningCount;
    console.info(
      `${LOG_PREFIX} build completed entries=${args.entriesExtracted} blockers=${args.recurringBlockers} wins=${args.winningPatterns} lessons=${args.lessonsCount} warnings=${args.missingDataWarningCount}`,
    );
  } catch {
    /* noop */
  }
}
