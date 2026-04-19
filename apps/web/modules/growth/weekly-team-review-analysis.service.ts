/**
 * Classify weekly team signals into human-readable buckets — no ML.
 */

export type TeamReviewAnalysisInput = {
  lowData: boolean;
  executionCompletionRate: number;
  tasksBlocked: number;
  tasksInProgress: number;
  leadDelta: number;
  qualifiedRate: number;
  wonThisWindow: number;
  cityBundlePresent: boolean;
  scalePositive?: boolean;
};

export type TeamReviewAnalysisBuckets = {
  positive: string[];
  negative: string[];
  neutral: string[];
  insufficient: string[];
};

export function analyzeWeeklyTeamSignals(input: TeamReviewAnalysisInput): TeamReviewAnalysisBuckets {
  const positive: string[] = [];
  const negative: string[] = [];
  const neutral: string[] = [];
  const insufficient: string[] = [];

  if (input.lowData) {
    insufficient.push("Sparse telemetry across CRM + Fast Deal logs — comparisons are directional only.");
    return { positive, negative, neutral, insufficient };
  }

  if (input.executionCompletionRate >= 0.45) {
    positive.push("Execution accountability completion rate is healthy versus template expectations.");
  } else if (input.executionCompletionRate > 0) {
    negative.push("Execution checklist completion trails target template fill rates.");
  }

  if (input.tasksBlocked > input.tasksInProgress && input.tasksBlocked >= 3) {
    negative.push("Blocked coordination tasks exceed in-flight work — dependency risk.");
  }

  if (input.leadDelta > 0) {
    positive.push("Lead capture count moved up versus the prior window.");
  } else if (input.leadDelta < 0) {
    negative.push("Lead capture count declined versus the prior window.");
  } else {
    neutral.push("Lead capture flat week-over-week.");
  }

  if (input.qualifiedRate >= 0.35) {
    positive.push("Qualified share of new leads meets or exceeds a conservative operating band.");
  } else if (input.qualifiedRate > 0 && input.qualifiedRate < 0.18) {
    negative.push("Qualified share of new leads is thin — qualification or routing friction possible.");
  }

  if (input.wonThisWindow === 0 && input.leadDelta >= 0 && input.leadDelta < 4) {
    neutral.push("No closed-won movements recorded this window — sample may still be short.");
  }

  if (!input.cityBundlePresent) {
    insufficient.push("City leaderboard omitted — enable Fast Deal comparison for geographic signals.");
  }

  if (input.scalePositive) {
    positive.push("Scale-system snapshot shows favorable lead-volume delta vs prior window (associational).");
  }

  return { positive, negative, neutral, insufficient };
}
