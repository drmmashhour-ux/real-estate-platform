/**
 * Platform improvement monitoring — never throws.
 */

const LOG_PREFIX = "[platform:improvement]";

export type PlatformImprovementMonitoringState = {
  reviewsBuilt: number;
  prioritiesGenerated: number;
  monetizationGapsFound: number;
  trustGapsFound: number;
  opsIssuesFound: number;
  dataMoatGapsFound: number;
};

let state: PlatformImprovementMonitoringState = {
  reviewsBuilt: 0,
  prioritiesGenerated: 0,
  monetizationGapsFound: 0,
  trustGapsFound: 0,
  opsIssuesFound: 0,
  dataMoatGapsFound: 0,
};

export function getPlatformImprovementMonitoringSnapshot(): PlatformImprovementMonitoringState {
  return { ...state };
}

export function resetPlatformImprovementMonitoringForTests(): void {
  state = {
    reviewsBuilt: 0,
    prioritiesGenerated: 0,
    monetizationGapsFound: 0,
    trustGapsFound: 0,
    opsIssuesFound: 0,
    dataMoatGapsFound: 0,
  };
}

export function recordPlatformImprovementReview(args: {
  priorityCount: number;
  monetizationGapCount: number;
  trustGapCount: number;
  opsIssueCount: number;
  dataMoatGapCount: number;
}): void {
  try {
    state.reviewsBuilt += 1;
    state.prioritiesGenerated += args.priorityCount;
    state.monetizationGapsFound += args.monetizationGapCount;
    state.trustGapsFound += args.trustGapCount;
    state.opsIssuesFound += args.opsIssueCount;
    state.dataMoatGapsFound += args.dataMoatGapCount;
    console.info(
      `${LOG_PREFIX} review built priorities=${args.priorityCount} mon=${args.monetizationGapCount} trust=${args.trustGapCount} ops=${args.opsIssueCount} data=${args.dataMoatGapCount}`,
    );
  } catch {
    /* noop */
  }
}
