/**
 * Evaluates Fusion-local proxy outcomes — read-only metrics, safe with partial data.
 */
import type { GlobalFusionLearningDecisionQuality, GlobalFusionLearningOutcome, GlobalFusionSource } from "./global-fusion.types";

function finiteRate(num: number, den: number): number | null {
  if (den <= 0 || !Number.isFinite(num) || !Number.isFinite(den)) return null;
  return Math.min(1, Math.max(0, num / den));
}

export function evaluateLearningOutcomes(
  outcomes: GlobalFusionLearningOutcome[],
): {
  accuracyEstimate: number | null;
  recommendationHitRate: number | null;
  falsePositiveRate: number | null;
  falseNegativeRate: number | null;
  quality: GlobalFusionLearningDecisionQuality;
  perSourceHits: Partial<Record<GlobalFusionSource, { hits: number; total: number }>>;
} {
  const usable = outcomes.filter((o) => o.success !== null && o.linkageStrength !== "unavailable");
  const total = usable.length;
  const hits = usable.filter((o) => o.success === true).length;
  const misses = usable.filter((o) => o.success === false).length;

  const recommendationHitRate = finiteRate(hits, total);
  const accuracyEstimate = recommendationHitRate;

  const falsePositiveRate = finiteRate(
    usable.filter((o) => o.success === false && o.outcomeType === "proxy_failure").length,
    total,
  );
  const falseNegativeRate = finiteRate(
    usable.filter((o) => o.success === true && o.outcomeType === "proxy_success").length,
    Math.max(1, total),
  );

  const perSourceHits: Partial<Record<GlobalFusionSource, { hits: number; total: number }>> = {};
  for (const o of usable) {
    const src = o.source;
    if (src !== "brain" && src !== "ads" && src !== "cro" && src !== "ranking") continue;
    if (!perSourceHits[src]) perSourceHits[src] = { hits: 0, total: 0 };
    perSourceHits[src]!.total++;
    if (o.success === true) perSourceHits[src]!.hits++;
  }

  const quality: GlobalFusionLearningDecisionQuality = {
    recommendationHitRate,
    falsePositiveRate,
    falseNegativeRate,
    confidenceCalibration: recommendationHitRate,
    riskCalibration: finiteRate(misses, total),
    agreementUsefulness: null,
  };

  return {
    accuracyEstimate,
    recommendationHitRate,
    falsePositiveRate,
    falseNegativeRate,
    quality,
    perSourceHits,
  };
}

export function computeSourceHitRates(
  perSource: Partial<Record<GlobalFusionSource, { hits: number; total: number }>>,
): Partial<Record<GlobalFusionSource, number>> {
  const out: Partial<Record<GlobalFusionSource, number>> = {};
  for (const k of ["brain", "ads", "cro", "ranking"] as const) {
    const row = perSource[k];
    if (row && row.total > 0) {
      out[k] = row.hits / row.total;
    }
  }
  return out;
}
