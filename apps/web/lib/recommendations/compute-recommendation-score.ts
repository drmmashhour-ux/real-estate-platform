/**
 * Hybrid recommendation score — tunable weights for similarity, preferences, popularity, quality, exploration.
 */

export type HybridScoreParts = {
  similarity_score: number;
  preference_score: number;
  popularity_score: number;
  quality_score: number;
  exploration_score: number;
};

/** Default: similarity-heavy blend (all 0–1). */
export const DEFAULT_HYBRID_WEIGHTS: Record<keyof HybridScoreParts, number> = {
  similarity_score: 0.4,
  preference_score: 0.25,
  popularity_score: 0.2,
  quality_score: 0.1,
  exploration_score: 0.05,
};

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

export function mergeHybridWeights(
  base: Record<keyof HybridScoreParts, number>,
  patch: Partial<Record<keyof HybridScoreParts, number>>
): Record<keyof HybridScoreParts, number> {
  const out = { ...base };
  for (const k of Object.keys(patch) as (keyof HybridScoreParts)[]) {
    if (patch[k] != null && Number.isFinite(patch[k]!)) out[k] = patch[k]!;
  }
  const sum = Object.values(out).reduce((a, b) => a + b, 0);
  if (sum <= 0) return base;
  if (Math.abs(sum - 1) < 1e-6) return out;
  const f = 1 / sum;
  for (const k of Object.keys(out) as (keyof HybridScoreParts)[]) {
    out[k] *= f;
  }
  return out;
}

/**
 * Returns 0–100 for explainability; internal signals are 0–1.
 */
export function computeHybridRecommendationScore(
  parts: Partial<HybridScoreParts>,
  weights: Record<keyof HybridScoreParts, number> = DEFAULT_HYBRID_WEIGHTS
): number {
  const full: HybridScoreParts = {
    similarity_score: clamp01(parts.similarity_score ?? 0),
    preference_score: clamp01(parts.preference_score ?? 0),
    popularity_score: clamp01(parts.popularity_score ?? 0),
    quality_score: clamp01(parts.quality_score ?? 0),
    exploration_score: clamp01(parts.exploration_score ?? 0),
  };
  let num = 0;
  let den = 0;
  for (const k of Object.keys(weights) as (keyof HybridScoreParts)[]) {
    const w = weights[k] ?? 0;
    if (w <= 0) continue;
    num += w * full[k];
    den += w;
  }
  if (den <= 0) return 0;
  return (num / den) * 100;
}
