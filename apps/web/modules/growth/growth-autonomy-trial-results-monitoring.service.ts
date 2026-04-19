/**
 * Trial results measurement monitoring — never throws.
 */

const LOG_PREFIX = "[growth:autonomy:trial-results]";

export type GrowthAutonomyTrialResultsMonitoringState = {
  resultsComputed: number;
  safetySafe: number;
  safetyCaution: number;
  safetyUnsafe: number;
  usefulnessStrong: number;
  usefulnessGood: number;
  usefulnessWeak: number;
  usefulnessPoor: number;
  usefulnessInsufficient: number;
  decisionsKeepInternal: number;
  decisionsHold: number;
  decisionsRollback: number;
  decisionsEligibleFutureReview: number;
  decisionsInsufficientData: number;
  insufficientDataCases: number;
};

let state: GrowthAutonomyTrialResultsMonitoringState = {
  resultsComputed: 0,
  safetySafe: 0,
  safetyCaution: 0,
  safetyUnsafe: 0,
  usefulnessStrong: 0,
  usefulnessGood: 0,
  usefulnessWeak: 0,
  usefulnessPoor: 0,
  usefulnessInsufficient: 0,
  decisionsKeepInternal: 0,
  decisionsHold: 0,
  decisionsRollback: 0,
  decisionsEligibleFutureReview: 0,
  decisionsInsufficientData: 0,
  insufficientDataCases: 0,
};

export function getGrowthAutonomyTrialResultsMonitoringSnapshot(): GrowthAutonomyTrialResultsMonitoringState {
  return { ...state };
}

export function resetGrowthAutonomyTrialResultsMonitoringForTests(): void {
  state = {
    resultsComputed: 0,
    safetySafe: 0,
    safetyCaution: 0,
    safetyUnsafe: 0,
    usefulnessStrong: 0,
    usefulnessGood: 0,
    usefulnessWeak: 0,
    usefulnessPoor: 0,
    usefulnessInsufficient: 0,
    decisionsKeepInternal: 0,
    decisionsHold: 0,
    decisionsRollback: 0,
    decisionsEligibleFutureReview: 0,
    decisionsInsufficientData: 0,
    insufficientDataCases: 0,
  };
}

export function recordGrowthAutonomyTrialResultsComputed(args: {
  safetyLevel: "safe" | "caution" | "unsafe";
  usefulness: "strong" | "good" | "weak" | "poor" | "insufficient_data";
  decision: string;
  insufficientData: boolean;
}): void {
  try {
    state.resultsComputed += 1;
    if (args.insufficientData) state.insufficientDataCases += 1;

    if (args.safetyLevel === "safe") state.safetySafe += 1;
    else if (args.safetyLevel === "caution") state.safetyCaution += 1;
    else state.safetyUnsafe += 1;

    switch (args.usefulness) {
      case "strong":
        state.usefulnessStrong += 1;
        break;
      case "good":
        state.usefulnessGood += 1;
        break;
      case "weak":
        state.usefulnessWeak += 1;
        break;
      case "poor":
        state.usefulnessPoor += 1;
        break;
      default:
        state.usefulnessInsufficient += 1;
    }

    switch (args.decision) {
      case "keep_internal":
        state.decisionsKeepInternal += 1;
        break;
      case "hold":
        state.decisionsHold += 1;
        break;
      case "rollback":
        state.decisionsRollback += 1;
        break;
      case "eligible_for_future_review":
        state.decisionsEligibleFutureReview += 1;
        break;
      case "insufficient_data":
        state.decisionsInsufficientData += 1;
        break;
      default:
        state.decisionsInsufficientData += 1;
    }

    console.info(
      `${LOG_PREFIX} computed decision=${args.decision} safety=${args.safetyLevel} usefulness=${args.usefulness} insufficient=${args.insufficientData}`,
    );
  } catch {
    /* noop */
  }
}
