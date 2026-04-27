import { MAX_PRICE_CHANGE_PCT } from "@/lib/ai/autonomy-constants";
import { REVENUE_MAX_PRICE_CHANGE_PCT } from "@/lib/ai/priceOptimizer";
import type { AutonomousAction } from "./executor";

/**
 * Strips actions that are unsafe to auto-execute. Does not run side effects.
 */
export function filterActions(actions: AutonomousAction[]): AutonomousAction[] {
  return actions.filter((a) => {
    if (a.type === "price_update") {
      const pct = Math.abs(a.changePct ?? 0);
      const cap =
        a.source === "revenue_optimizer" ? REVENUE_MAX_PRICE_CHANGE_PCT : MAX_PRICE_CHANGE_PCT;
      return pct <= cap;
    }
    if (a.type === "listing_improvement") {
      return false;
    }
    if (a.type === "manual_review_flag") {
      return true;
    }
    if (a.type === "compliance_block") {
      return true;
    }
    return true;
  });
}
