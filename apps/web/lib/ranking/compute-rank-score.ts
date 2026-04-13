/**
 * Unified 8-factor rank score (0–100) for explainable tuning.
 * Maps existing `RankingSignalBundle` + optional exploration into one formula.
 */

import type { RankingSignalBundle } from "@/src/modules/ranking/types";
import { clamp01 } from "./normalize-metrics";

export type RankScoreComponents = {
  relevance_score: number;
  quality_score: number;
  trust_score: number;
  performance_score: number;
  price_score: number;
  freshness_score: number;
  availability_score: number;
  exploration_score: number;
};

/** Default blend — configurable per env / DB `ranking_configs`. */
export const DEFAULT_UNIFIED_RANK_WEIGHTS: Record<keyof RankScoreComponents, number> = {
  relevance_score: 0.25,
  quality_score: 0.15,
  trust_score: 0.15,
  performance_score: 0.2,
  price_score: 0.1,
  freshness_score: 0.05,
  availability_score: 0.05,
  exploration_score: 0.05,
};

export function mergeRankWeights(
  base: Record<keyof RankScoreComponents, number>,
  patch: Partial<Record<keyof RankScoreComponents, number>>
): Record<keyof RankScoreComponents, number> {
  const out = { ...base };
  for (const k of Object.keys(patch) as (keyof RankScoreComponents)[]) {
    if (patch[k] != null && Number.isFinite(patch[k]!)) out[k] = patch[k]!;
  }
  const sum = Object.values(out).reduce((a, b) => a + b, 0);
  if (sum <= 0) return base;
  if (Math.abs(sum - 1) < 1e-6) return out;
  const f = 1 / sum;
  for (const k of Object.keys(out) as (keyof RankScoreComponents)[]) {
    out[k] *= f;
  }
  return out;
}

/**
 * Collapse engagement + conversion + host responsiveness into a single "performance" pillar.
 */
export function mapSignalsToRankComponents(
  s: RankingSignalBundle,
  exploration01 = 0
): RankScoreComponents {
  const performance_score = clamp01(0.38 * s.engagement + 0.35 * s.conversion + 0.27 * s.host);
  return {
    relevance_score: s.relevance,
    quality_score: s.quality,
    trust_score: s.trust,
    performance_score,
    price_score: s.priceCompetitiveness,
    freshness_score: s.freshness,
    availability_score: s.availability,
    /** When using `blendPerformanceAndExploration` after the fact, pass 0 here and use `weightsWithoutExploration`. */
    exploration_score: clamp01(exploration01),
  };
}

/** Use with `computeRankScore` when exploration is applied via `blendPerformanceAndExploration` (search). */
export const UNIFIED_WEIGHTS_WITHOUT_EXPLORATION = mergeRankWeights(DEFAULT_UNIFIED_RANK_WEIGHTS, {
  exploration_score: 0,
  performance_score: DEFAULT_UNIFIED_RANK_WEIGHTS.performance_score + DEFAULT_UNIFIED_RANK_WEIGHTS.exploration_score,
});

export function computeRankScore(
  c: RankScoreComponents,
  weights: Record<keyof RankScoreComponents, number> = DEFAULT_UNIFIED_RANK_WEIGHTS
): number {
  let num = 0;
  let den = 0;
  for (const k of Object.keys(weights) as (keyof RankScoreComponents)[]) {
    const w = weights[k] ?? 0;
    if (w <= 0) continue;
    num += w * clamp01(c[k]);
    den += w;
  }
  if (den <= 0) return 0;
  return (num / den) * 100;
}

export type AntiGamingBnhubInput = {
  nightPriceCents: number;
  medianNightPriceCents: number | null;
  /** Low CTR with high views suggests bounce / mismatch */
  views30d?: number | null;
  ctr?: number | null;
  /** Heuristic: many updates in short window — optional */
  listingAgeDays?: number;
};

/**
 * Soft penalties — never zero-out legitimate listings.
 */
export function applyAntiGamingBnhub(
  components: RankScoreComponents,
  ag: AntiGamingBnhubInput
): RankScoreComponents {
  const out = { ...components };
  const med = ag.medianNightPriceCents;
  if (med != null && med > 0) {
    const ratio = ag.nightPriceCents / med;
    if (ratio < 0.35 || ratio > 2.8) {
      out.price_score = clamp01(out.price_score * 0.82);
      out.trust_score = clamp01(out.trust_score * 0.92);
    }
  }
  const v = ag.views30d ?? 0;
  const ctr = ag.ctr;
  if (v > 80 && ctr != null && ctr < 0.04) {
    out.performance_score = clamp01(out.performance_score * 0.88);
  }
  if (ag.listingAgeDays != null && ag.listingAgeDays > 400 && out.freshness_score > 0.85) {
    out.freshness_score = clamp01(out.freshness_score * 0.9);
  }
  return out;
}
