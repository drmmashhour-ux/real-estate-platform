/**
 * Max 5 leadership-style insight lines — advisory, not guarantees.
 */

import type { WeeklyTeamReview } from "@/modules/growth/weekly-team-review.types";

export function buildWeeklyTeamReviewInsights(review: WeeklyTeamReview): string[] {
  const out: string[] = [];

  const conf = review.meta.confidence === "high" ? "Higher" : review.meta.confidence === "medium" ? "Moderate" : "Low";

  if (review.meta.warnings.some((w) => w.toLowerCase().includes("sparse"))) {
    out.push(`${conf} bundle confidence — several growth layers are thin; avoid decisive budget moves from this read alone.`);
  }

  if (
    review.execution.completionRate >= 0.35 &&
    review.pipeline.leadsQualified < review.pipeline.leadsCaptured * 0.2
  ) {
    out.push("Execution rhythm looks engaged, but qualification yield is weak — inspect handoffs and routing quality.");
  }

  if (review.performance.topCity && review.performance.weakestCity && review.performance.topCity !== review.performance.weakestCity) {
    out.push(
      `City ${review.performance.topCity} leads the Fast Deal bundle; ${review.performance.weakestCity} lags — treat as prioritization hint, not proof.`,
    );
  }

  if (review.execution.tasksBlocked > review.execution.tasksInProgress) {
    out.push("More blocked coordination items than active work — clear blockers before adding new initiatives.");
  }

  if (review.dealInsights.scriptUsageHighlights.length && review.execution.completionRate < 0.25) {
    out.push("Pitch scripts show usage but execution checklists stay light — pair prep with logged follow-through.");
  }

  if (review.pipeline.leadsCaptured > 0 && review.pipeline.dealsClosed === 0) {
    out.push("Pipeline has intake but no closes this window — expected for short windows; extend observation before diagnosing closing.");
  }

  if (out.length === 0) {
    out.push("Operating picture is stable — maintain cadence and watch next window for directional moves.");
  }

  return out.slice(0, 5);
}
