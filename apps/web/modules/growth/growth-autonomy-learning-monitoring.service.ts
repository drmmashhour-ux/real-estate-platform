/**
 * In-process learning counters — prefix [growth:autonomy:learning], never throws.
 */

const PREFIX = "[growth:autonomy:learning]";

export type GrowthAutonomyLearningMonitoringState = {
  recordsCreated: number;
  categoriesAdjusted: number;
  categoriesSuppressed: number;
  manualResets: number;
  sparseDataCases: number;
  learningDisabledSkips: number;
  cyclesRun: number;
};

let state: GrowthAutonomyLearningMonitoringState = {
  recordsCreated: 0,
  categoriesAdjusted: 0,
  categoriesSuppressed: 0,
  manualResets: 0,
  sparseDataCases: 0,
  learningDisabledSkips: 0,
  cyclesRun: 0,
};

export function getGrowthAutonomyLearningMonitoringSnapshot(): GrowthAutonomyLearningMonitoringState {
  return { ...state };
}

export function resetGrowthAutonomyLearningMonitoringForTests(): void {
  state = {
    recordsCreated: 0,
    categoriesAdjusted: 0,
    categoriesSuppressed: 0,
    manualResets: 0,
    sparseDataCases: 0,
    learningDisabledSkips: 0,
    cyclesRun: 0,
  };
}

function logInfo(msg: string): void {
  try {
    console.info(`${PREFIX} ${msg}`);
  } catch {
    /* noop */
  }
}

export function recordLearningRecordCreated(): void {
  try {
    state.recordsCreated += 1;
    logInfo(`record created total=${state.recordsCreated}`);
  } catch {
    /* noop */
  }
}

export function recordLearningCycle(args: { adjusted: number; suppressed: number; sparse: number }): void {
  try {
    state.cyclesRun += 1;
    state.categoriesAdjusted += args.adjusted;
    state.categoriesSuppressed += args.suppressed;
    state.sparseDataCases += args.sparse;
    logInfo(
      `cycle=${state.cyclesRun} adjusted=${args.adjusted} suppressed=${args.suppressed} sparse=${args.sparse}`,
    );
  } catch {
    /* noop */
  }
}

export function recordLearningManualReset(): void {
  try {
    state.manualResets += 1;
    logInfo(`manual_reset total=${state.manualResets}`);
  } catch {
    /* noop */
  }
}

export function recordLearningDisabledSkip(): void {
  try {
    state.learningDisabledSkips += 1;
  } catch {
    /* noop */
  }
}
