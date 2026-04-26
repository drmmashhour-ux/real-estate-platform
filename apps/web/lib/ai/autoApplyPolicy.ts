import type { AutonomousAction } from "./executor";

/**
 * Whether a single action is small enough to auto-apply in safe modes (5% or less nightly move).
 * `changePct` is optional; when absent, this returns false.
 */
export function canAutoApply(action: AutonomousAction): boolean {
  if (action.type === "price_update") {
    if (typeof action.changePct === "number" && Math.abs(action.changePct) <= 0.05) {
      return true;
    }
  }
  return false;
}
