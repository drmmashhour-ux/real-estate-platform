import type { HiringStage } from "./constants";

const HIGH_THRESHOLD = 8;
const LOW_THRESHOLD = 5;

/**
 * Auto-flag candidates from latest overall score + pipeline stage.
 * High: strong score while still in funnel; Low: weak score; needs_review: border band.
 */
export function computePerformanceFlag(
  overallScore: number,
  stage: HiringStage
): "high_performer" | "low_performer" | "needs_review" | null {
  if (stage === "hired" || stage === "rejected") {
    return null;
  }

  if (overallScore >= HIGH_THRESHOLD && ["interview", "trial", "screening"].includes(stage)) {
    return "high_performer";
  }
  if (overallScore <= LOW_THRESHOLD && overallScore > 0) {
    return "low_performer";
  }
  if (overallScore > LOW_THRESHOLD && overallScore < HIGH_THRESHOLD) {
    return "needs_review";
  }
  if (overallScore >= HIGH_THRESHOLD && stage === "applied") {
    return "needs_review";
  }
  return null;
}
