/**
 * Deterministic usefulness bands — does not infer business ROI from usage alone.
 */

import type {
  GrowthAutonomyTrialOperatorFeedbackSummary,
  GrowthAutonomyTrialUsefulnessBand,
} from "./growth-autonomy-trial-results.types";

export function scoreGrowthAutonomyTrialUsefulness(args: {
  feedback: GrowthAutonomyTrialOperatorFeedbackSummary;
  undoRollbackRate: number | null;
  sparseData: boolean;
}): GrowthAutonomyTrialUsefulnessBand {
  if (args.sparseData) return "insufficient_data";
  if (args.feedback.total < 2) return "insufficient_data";

  const pos = args.feedback.positiveRate ?? 0;
  const conf = args.feedback.confusionRate ?? 0;
  const undo = args.undoRollbackRate ?? 0;

  if (conf >= 0.35) return "poor";
  if (undo >= 0.45) return "poor";
  if (pos >= 0.65 && conf <= 0.18) return "strong";
  if (pos >= 0.45 && conf <= 0.28) return "good";
  if (pos >= 0.28) return "weak";
  return "poor";
}
