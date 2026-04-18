import type { LecipmCoreAutopilotExecutionMode } from "../types";

/** Types that may auto-materialize as DB candidates only (no user content overwrite). */
const SAFE_AUTOPILOT_ALLOWED = new Set(["mark_growth_candidate", "mark_featured_candidate"]);

/**
 * Hard gate: only explicit allowlist + low risk may auto-execute in SAFE_AUTOPILOT.
 * Unknown `actionType` or non-low risk always returns false (no implicit allow).
 */
export function canAutoExecuteInMode(
  mode: LecipmCoreAutopilotExecutionMode,
  actionType: string,
  riskLevel: "low" | "medium" | "high"
): boolean {
  if (mode === "OFF") return false;
  if (mode === "ASSIST") return false;
  if (mode === "FULL_AUTOPILOT_APPROVAL") return false;
  if (mode === "SAFE_AUTOPILOT") {
    return riskLevel === "low" && SAFE_AUTOPILOT_ALLOWED.has(actionType);
  }
  return false;
}
