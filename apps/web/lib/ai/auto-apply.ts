import type { AutonomousAction } from "./executor";

const AUTO_APPLY_MAX_ABS_PRICE_PCT = 0.05;

/**
 * Tight HITL gate: only very small **price** nudges may be auto-applied; everything else needs explicit approval.
 */
export function canAutoApply(action: AutonomousAction | { type: string; changePct?: number }): boolean {
  if (action.type === "price_update") {
    if (action.changePct == null || !Number.isFinite(action.changePct)) {
      return false;
    }
    return Math.abs(action.changePct) <= AUTO_APPLY_MAX_ABS_PRICE_PCT;
  }
  return false;
}
