import {
  PRICING_MAX_CHANGE,
  PRICING_MAX_PRICE_CENTS,
  PRICING_MIN_PRICE_CENTS,
} from "./optimizer-constants";
import type { ListingSignals } from "./signals";

export type OptimizationDecision = {
  action: "increase_price" | "decrease_price" | "none";
  changePct: number;
};

/**
 * Heuristic from occupancy only — no DB I/O. `changePct` is clamped to {@link PRICING_MAX_CHANGE}.
 * Downstream: {@link buildSuggestedCents} applies the factor and clamps to min/max **cents**.
 */
export function decidePricing(signals: ListingSignals): OptimizationDecision {
  if (signals.occupancyRate > 0.75) {
    return { action: "increase_price", changePct: Math.min(0.1, PRICING_MAX_CHANGE) };
  }
  if (signals.occupancyRate < 0.3) {
    return { action: "decrease_price", changePct: Math.min(0.1, PRICING_MAX_CHANGE) };
  }
  return { action: "none", changePct: 0 };
}

/** Clamps a signed ± fraction so |delta| never exceeds `PRICING_MAX_CHANGE`. */
export function clampPriceDelta(delta: number): number {
  if (!Number.isFinite(delta)) return 0;
  if (delta > PRICING_MAX_CHANGE) return PRICING_MAX_CHANGE;
  if (delta < -PRICING_MAX_CHANGE) return -PRICING_MAX_CHANGE;
  return delta;
}

/**
 * Suggested new nightly price in **cents** (guardrails, no DB). Never moves more than
 * 20% from base, and never below/above min/max list price.
 */
export function buildSuggestedCents(
  basePriceCents: number,
  decision: OptimizationDecision
): number | null {
  if (decision.action === "none" || basePriceCents <= 0 || !Number.isFinite(basePriceCents)) {
    return null;
  }
  const sign = decision.action === "increase_price" ? 1 : -1;
  const rawDelta = sign * decision.changePct;
  const delta = clampPriceDelta(rawDelta);
  const next = Math.round(basePriceCents * (1 + delta));
  if (!Number.isFinite(next) || next <= 0) return null;
  return Math.min(PRICING_MAX_PRICE_CENTS, Math.max(PRICING_MIN_PRICE_CENTS, next));
}
