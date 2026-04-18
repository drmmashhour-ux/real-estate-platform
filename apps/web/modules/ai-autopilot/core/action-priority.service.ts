import type { RankedAction } from "../ai-autopilot.types";
import type { ActionQualityResult } from "./action-quality-score.service";

export type PriorityBucket = "DO_NOW" | "DO_TODAY" | "THIS_WEEK" | "LOW_PRIORITY" | "ARCHIVE";

/**
 * Maps ranked action + quality into a coarse priority bucket for UX and stale rules.
 */
export function assignPriorityBucket(action: RankedAction, quality: ActionQualityResult): PriorityBucket {
  if (quality.qualityScore < 18) return "ARCHIVE";
  if (quality.qualityScore < 35) return "LOW_PRIORITY";

  if (action.bucket === "observe_only") return "LOW_PRIORITY";

  if (action.bucket === "do_now" && quality.qualityScore >= 55) return "DO_NOW";
  if (action.bucket === "do_today" || (action.bucket === "do_now" && quality.qualityScore < 55)) return "DO_TODAY";
  if (action.bucket === "do_this_week") return "THIS_WEEK";

  return quality.qualityScore >= 50 ? "THIS_WEEK" : "LOW_PRIORITY";
}
