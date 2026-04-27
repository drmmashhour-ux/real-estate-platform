import { prisma } from "@/lib/db";
import { loadAbAggregateRowsFromGrowth } from "@/lib/ab/growth-aggregate";
import { pickWinner } from "@/lib/ab/winner";
import type { AbAggregateRow } from "@/lib/ab/winner";

/** Prevent runaway multipliers in ranking and pricing. */
export const MIN_LEARNING_WEIGHT = 0.5;
export const MAX_LEARNING_WEIGHT = 2;

const DEFAULT_WEIGHT = 1;

/** Maps registered experiment `id` → persisted `learning_metrics.key`. */
const EXPERIMENT_ID_TO_METRIC_KEY: Record<string, string> = {
  booking_cta: "booking_cta_weight",
  landing_headline: "landing_headline_weight",
  pricing_display: "price_sensitivity",
};

function metricKeyForExperiment(experimentId: string): string {
  return EXPERIMENT_ID_TO_METRIC_KEY[experimentId] ?? `${experimentId}_weight`;
}

/**
 * Map observed conversion rate (0–1) to a weight in [MIN_LEARNING_WEIGHT, MAX_LEARNING_WEIGHT].
 * Higher observed rates push the weight toward MAX (reward winning variants).
 */
export function conversionRateToClampedWeight(conversionRate: number): number {
  const r = Math.min(1, Math.max(0, conversionRate));
  return MIN_LEARNING_WEIGHT + r * (MAX_LEARNING_WEIGHT - MIN_LEARNING_WEIGHT);
}

/**
 * Read a stored tunable, clamped to guardrails. Returns `defaultValue` if missing or invalid.
 */
export async function getLearningWeight(key: string, defaultValue: number = DEFAULT_WEIGHT): Promise<number> {
  const row = await prisma.learningMetric.findUnique({
    where: { key },
    select: { value: true },
  });
  const raw = row?.value;
  if (typeof raw !== "number" || !Number.isFinite(raw)) {
    return defaultValue;
  }
  return Math.min(MAX_LEARNING_WEIGHT, Math.max(MIN_LEARNING_WEIGHT, raw));
}

/** Alias for `getLearningWeight` — e.g. `ranking_boost` in `learning_metrics`. */
export async function getWeight(key: string, defaultValue: number = DEFAULT_WEIGHT): Promise<number> {
  return getLearningWeight(key, defaultValue);
}

type WinnerLike = Pick<AbAggregateRow, "exposures" | "conversions">;

/**
 * Persists the **clamped** learned weight for this experiment (key from `EXPERIMENT_ID_TO_METRIC_KEY` or `{id}_weight`).
 */
export async function updateLearning(experiment: string, winner: WinnerLike | null | undefined): Promise<void> {
  if (!winner) return;
  const exp = Math.max(0, Number(winner.exposures) || 0);
  const conv = Math.max(0, Number(winner.conversions) || 0);
  const rate = conv / Math.max(1, exp);
  const value = conversionRateToClampedWeight(rate);
  const key = metricKeyForExperiment(experiment);

  await prisma.learningMetric.upsert({
    where: { key },
    create: { key, value },
    update: { value, updatedAt: new Date() },
  });
}

/**
 * Recompute per-experiment winner rows from `growth_events`, then upsert `learning_metrics`.
 * Safe to run from cron; idempotent for a given 7d window of data.
 */
export async function refreshLearningFromAbResults(days: number = 7): Promise<{
  updated: { experiment: string; key: string; value: number }[];
}> {
  const rows = await loadAbAggregateRowsFromGrowth(days);
  const byExperiment = new Map<string, typeof rows>();
  for (const row of rows) {
    const ex = row.experiment ?? "";
    if (!ex) continue;
    if (!byExperiment.has(ex)) byExperiment.set(ex, []);
    byExperiment.get(ex)!.push(row);
  }

  const updated: { experiment: string; key: string; value: number }[] = [];

  for (const [experiment, list] of byExperiment) {
    const w = pickWinner(
      list.map((r) => ({
        experiment: r.experiment,
        variant: r.variant,
        exposures: r.exposures,
        conversions: r.conversions,
      }))
    );
    if (!w) continue;
    await updateLearning(experiment, w);
    const key = metricKeyForExperiment(experiment);
    const row = await prisma.learningMetric.findUnique({ where: { key } });
    if (row) {
      updated.push({ experiment, key, value: row.value });
    }
  }

  return { updated };
}
