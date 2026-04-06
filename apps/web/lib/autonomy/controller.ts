import type { AutonomousAction, AutonomyMode } from "./types";
import { isBlockedAction } from "./guardrails";

export type ExecuteDecision = {
  execute: boolean;
  reason: string;
};

/**
 * Whether the action may run **without** a separate human approval step right now.
 * - OFF / ASSIST → never auto-execute.
 * - SAFE_AUTOPILOT / FULL_WITH_APPROVAL → only **low** risk, and never blocked guardrail types.
 * - **Medium** risk → false (enqueue approval queue first).
 */
export function shouldExecuteAction(mode: AutonomyMode, action: AutonomousAction): ExecuteDecision {
  if (isBlockedAction(action)) {
    return { execute: false, reason: "blocked_by_guardrail" };
  }
  if (mode === "OFF") {
    return { execute: false, reason: "mode_off" };
  }
  if (mode === "ASSIST") {
    return { execute: false, reason: "assist_suggestions_only" };
  }
  if (mode === "SAFE_AUTOPILOT" || mode === "FULL_WITH_APPROVAL") {
    if (action.risk === "low") {
      return { execute: true, reason: "low_risk_auto_eligible" };
    }
    if (action.risk === "medium") {
      return { execute: false, reason: "medium_risk_requires_approval" };
    }
    return { execute: false, reason: "high_risk_blocked" };
  }
  return { execute: false, reason: "unknown_mode" };
}
