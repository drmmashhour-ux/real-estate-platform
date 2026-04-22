/**
 * Operator / residence ranking beyond pure family fit — blended display score.
 */
import type { OperatorPerfSignals } from "./senior-ai.types";

/** Cold-start visibility boost for new quality operators (bounded). */
const COLD_START_BOOST = 8;

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

/** Map lower response time hours to higher score (cap at 72h). */
export function responseTimeScore(avgHours: number | null | undefined): number {
  if (avgHours == null || !Number.isFinite(avgHours)) return 72;
  const h = Math.min(72, Math.max(0, avgHours));
  return Math.round(100 * (1 - h / 72));
}

export function computeRankingScore(signals: OperatorPerfSignals): number {
  const conv = clamp01(signals.conversionRate ?? 0.12);
  const visit = clamp01(signals.visitRate ?? 0.18);
  const resp = clamp01(responseTimeScore(signals.responseTimeAvgHours ?? null) / 100);
  const accept = clamp01(signals.leadAcceptanceRate ?? 0.5);
  const profile = clamp01(signals.profileCompleteness ?? 0.55);
  const trust = clamp01(signals.trustScore ?? (signals.coldStart ? 0.55 : 0.72));

  let ranking =
    0.26 * conv +
    0.18 * visit +
    0.18 * resp +
    0.12 * accept +
    0.12 * profile +
    0.14 * trust;

  ranking *= 100;
  if (signals.coldStart) ranking = Math.min(100, ranking + COLD_START_BOOST);

  return Math.round(Math.max(0, Math.min(100, ranking)));
}

export function computeDisplayScore(baseMatchScore: number, rankingScore: number): number {
  return Math.round(0.72 * baseMatchScore + 0.28 * rankingScore);
}
