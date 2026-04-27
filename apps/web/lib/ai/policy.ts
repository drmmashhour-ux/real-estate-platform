import type { AutonomousAction } from "./executor";
import { MAX_PRICE_CHANGE_PCT } from "./autonomy-constants";

export type PolicyContext = {
  /** Current list / nightly ask in major units, for bounded price nudges. */
  currentPriceDollars: number | null;
};

/**
 * Central allow-list of **intent** (learning may only tune weights elsewhere — never override hard rules).
 * `listing_improvement` rows are still stripped by `filterActions` at execution.
 */
export function policyFor(flags: string[], ctx: PolicyContext): AutonomousAction[] {
  const actions: AutonomousAction[] = [];
  const base = ctx.currentPriceDollars;
  if (flags.includes("low_occupancy") && base != null && base > 0) {
    const changePct = -MAX_PRICE_CHANGE_PCT;
    const newPrice = base * (1 + changePct);
    actions.push({ type: "price_update", newPrice, changePct });
  }
  if (flags.includes("no_conversion")) {
    actions.push({
      type: "listing_improvement",
      issues: ["no_conversion:policy"],
      actions: ["Review photos, price, and title so visits convert to inquiries."],
    });
  }
  if (flags.includes("high_dropoff")) {
    actions.push({
      type: "listing_improvement",
      issues: ["high_dropoff:policy"],
      actions: ["High traffic, low intent — test headline and first photo; confirm calendar accuracy."],
    });
  }
  return actions;
}
