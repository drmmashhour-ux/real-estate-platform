/**
 * Governance feedback observability — gated by feature flag at call sites; never throws.
 */

const LOG_PREFIX = "[growth:governance:feedback]";

export type GrowthGovernanceFeedbackMonitoringState = {
  feedbackBuilds: number;
  entriesExtracted: number;
  usefulConstraintsCount: number;
  freezePatternCount: number;
  blockedPatternCount: number;
  overconservativeCount: number;
  reviewQueueCount: number;
  missingDataWarnings: number;
};

let state: GrowthGovernanceFeedbackMonitoringState = {
  feedbackBuilds: 0,
  entriesExtracted: 0,
  usefulConstraintsCount: 0,
  freezePatternCount: 0,
  blockedPatternCount: 0,
  overconservativeCount: 0,
  reviewQueueCount: 0,
  missingDataWarnings: 0,
};

export function getGrowthGovernanceFeedbackMonitoringSnapshot(): GrowthGovernanceFeedbackMonitoringState {
  return { ...state };
}

export function resetGrowthGovernanceFeedbackMonitoringForTests(): void {
  state = {
    feedbackBuilds: 0,
    entriesExtracted: 0,
    usefulConstraintsCount: 0,
    freezePatternCount: 0,
    blockedPatternCount: 0,
    overconservativeCount: 0,
    reviewQueueCount: 0,
    missingDataWarnings: 0,
  };
}

export function logGrowthGovernanceFeedbackBuildStarted(): void {
  try {
    console.info(`${LOG_PREFIX} build started`);
  } catch {
    /* noop */
  }
}

export function recordGrowthGovernanceFeedbackBuild(args: {
  extractedCount: number;
  usefulCount: number;
  freezeCount: number;
  blockedCount: number;
  overconservativeCount: number;
  reviewQueueCount: number;
  insightCount: number;
  missingDataWarningCount: number;
}): void {
  try {
    state.feedbackBuilds += 1;
    state.entriesExtracted += args.extractedCount;
    state.usefulConstraintsCount += args.usefulCount;
    state.freezePatternCount += args.freezeCount;
    state.blockedPatternCount += args.blockedCount;
    state.overconservativeCount += args.overconservativeCount;
    state.reviewQueueCount += args.reviewQueueCount;
    state.missingDataWarnings += args.missingDataWarningCount;
    console.info(
      `${LOG_PREFIX} build completed extracted=${args.extractedCount} useful=${args.usefulCount} freeze=${args.freezeCount} blocked=${args.blockedCount} overconservative=${args.overconservativeCount} review_queue=${args.reviewQueueCount} insights=${args.insightCount} warnings=${args.missingDataWarningCount}`,
    );
  } catch {
    /* noop */
  }
}
