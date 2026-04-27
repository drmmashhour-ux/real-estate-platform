import { loadAbAggregateRowsFromGrowth } from "@/lib/ab/growth-aggregate";
import { pickWinner, type AbAggregateRow } from "@/lib/ab/winner";

/** Minimum ab_exposure volume (rolling window) before trusting a “winner” for autonomy gating. */
export const MIN_CONVERSION_AB_EXPOSURES = 20;

const GATE_ENV = "FEATURE_CONVERSION_AB_GATE";

export function isConversionAbGateEnabled(): boolean {
  return process.env[GATE_ENV] === "1";
}

/**
 * True when the aggregate winner for this experiment in the last N days is `variant` and
 * total exposures ≥ {@link MIN_CONVERSION_AB_EXPOSURES}. Otherwise false (conservative: no unvalidated rollout).
 */
export async function isWinningVariant(
  experiment: string,
  variant: string,
  days: number = 7
): Promise<boolean> {
  const rows = await loadAbAggregateRowsFromGrowth(Math.min(30, Math.max(1, days)));
  const forExp: AbAggregateRow[] = rows
    .filter((r) => (r.experiment ?? "") === experiment)
    .map((r) => ({
      experiment: r.experiment,
      variant: r.variant,
      exposures: r.exposures,
      conversions: r.conversions,
    }));
  if (forExp.length === 0) {
    return false;
  }
  const totalExposures = forExp.reduce((s, r) => s + (Number(r.exposures) || 0), 0);
  if (totalExposures < MIN_CONVERSION_AB_EXPOSURES) {
    return false;
  }
  const w = pickWinner(forExp);
  if (!w?.variant) {
    return false;
  }
  return w.variant === variant;
}

