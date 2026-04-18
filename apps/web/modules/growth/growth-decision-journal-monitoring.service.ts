/**
 * Decision journal monitoring — never throws.
 */

const LOG_PREFIX = "[growth:decision-journal]";

export type GrowthDecisionJournalMonitoringState = {
  journalBuilds: number;
  entriesBuilt: number;
  reflectionsBuilt: number;
  positiveOutcomeCount: number;
  negativeOutcomeCount: number;
  unknownOutcomeCount: number;
  missingDataWarnings: number;
};

let state: GrowthDecisionJournalMonitoringState = {
  journalBuilds: 0,
  entriesBuilt: 0,
  reflectionsBuilt: 0,
  positiveOutcomeCount: 0,
  negativeOutcomeCount: 0,
  unknownOutcomeCount: 0,
  missingDataWarnings: 0,
};

export function getGrowthDecisionJournalMonitoringSnapshot(): GrowthDecisionJournalMonitoringState {
  return { ...state };
}

export function resetGrowthDecisionJournalMonitoringForTests(): void {
  state = {
    journalBuilds: 0,
    entriesBuilt: 0,
    reflectionsBuilt: 0,
    positiveOutcomeCount: 0,
    negativeOutcomeCount: 0,
    unknownOutcomeCount: 0,
    missingDataWarnings: 0,
  };
}

export function logGrowthDecisionJournalBuildStarted(): void {
  try {
    console.info(`${LOG_PREFIX} build started`);
  } catch {
    /* noop */
  }
}

export function recordGrowthDecisionJournalBuild(args: {
  entryCount: number;
  reflectionCount: number;
  stats: {
    positiveOutcomeCount: number;
    negativeOutcomeCount: number;
    unknownOutcomeCount: number;
  };
  missingDataWarningCount: number;
}): void {
  try {
    state.journalBuilds += 1;
    state.entriesBuilt += args.entryCount;
    state.reflectionsBuilt += args.reflectionCount;
    state.positiveOutcomeCount += args.stats.positiveOutcomeCount;
    state.negativeOutcomeCount += args.stats.negativeOutcomeCount;
    state.unknownOutcomeCount += args.stats.unknownOutcomeCount;
    state.missingDataWarnings += args.missingDataWarningCount;
    console.info(
      `${LOG_PREFIX} build completed entries=${args.entryCount} reflections=${args.reflectionCount} +/-/?: ${args.stats.positiveOutcomeCount}/${args.stats.negativeOutcomeCount}/${args.stats.unknownOutcomeCount} warnings=${args.missingDataWarningCount}`,
    );
  } catch {
    /* noop */
  }
}
