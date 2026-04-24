/**
 * Default + experiment marketplace ranking weights (tunable via `RANKING_ALGO_COHORT` env).
 * All dimensions are 0–1 signals; weights sum to 1 before optional premium slice.
 */

export type MarketplaceRankingWeightKey =
  | "relevance"
  | "priceFit"
  | "propertyMatch"
  | "freshness"
  | "quality"
  | "trust"
  | "engagement"
  | "responseSpeed"
  | "conversion";

export type MarketplaceRankingWeights = Record<MarketplaceRankingWeightKey, number>;

/** Baseline: relevance-heavy, conversion-aware (matches product brief). */
export const MARKETPLACE_RANKING_WEIGHTS_BASELINE: MarketplaceRankingWeights = {
  relevance: 0.22,
  priceFit: 0.15,
  propertyMatch: 0.08,
  freshness: 0.05,
  quality: 0.15,
  trust: 0.1,
  engagement: 0.1,
  responseSpeed: 0.08,
  conversion: 0.07,
};

/** Experiment: emphasize relevance + trust (rollout-safe; still sums to 1). */
export const MARKETPLACE_RANKING_WEIGHTS_TEST_TRUST: MarketplaceRankingWeights = {
  relevance: 0.26,
  priceFit: 0.12,
  propertyMatch: 0.08,
  freshness: 0.05,
  quality: 0.14,
  trust: 0.14,
  engagement: 0.08,
  responseSpeed: 0.08,
  conversion: 0.05,
};

/**
 * Conversion- and quality-forward preset (availability blended into conversion signals in the engine).
 * Tunable via `BNHUB_RANKING_WEIGHTS_JSON` overlay without code changes.
 */
export const MARKETPLACE_RANKING_WEIGHTS_BOOKINGS_MAX_V1: MarketplaceRankingWeights = {
  relevance: 0.03,
  priceFit: 0.2,
  propertyMatch: 0.05,
  freshness: 0.07,
  quality: 0.15,
  trust: 0.15,
  engagement: 0.02,
  responseSpeed: 0.08,
  conversion: 0.25,
};

const PRESETS: Record<string, MarketplaceRankingWeights> = {
  baseline: MARKETPLACE_RANKING_WEIGHTS_BASELINE,
  test_trust: MARKETPLACE_RANKING_WEIGHTS_TEST_TRUST,
  bookings_max_v1: MARKETPLACE_RANKING_WEIGHTS_BOOKINGS_MAX_V1,
};

function tryParseBnhubWeightsEnv(): Partial<MarketplaceRankingWeights> | null {
  const raw = process.env.BNHUB_RANKING_WEIGHTS_JSON?.trim();
  if (!raw) return null;
  try {
    const j = JSON.parse(raw) as Partial<Record<MarketplaceRankingWeightKey, number>>;
    return j && typeof j === "object" ? j : null;
  } catch {
    return null;
  }
}

export function normalizeWeights(w: MarketplaceRankingWeights): MarketplaceRankingWeights {
  const sum = Object.values(w).reduce((a, b) => a + b, 0);
  if (sum <= 0) return { ...MARKETPLACE_RANKING_WEIGHTS_BASELINE };
  const out = { ...w };
  (Object.keys(out) as MarketplaceRankingWeightKey[]).forEach((k) => {
    out[k] = out[k] / sum;
  });
  return out;
}

/**
 * Resolve weights for a cohort key (`BNHUB_RANKING_EXPERIMENT`, `RANKING_ALGO_COHORT`, or caller-supplied).
 * Optional `BNHUB_RANKING_WEIGHTS_JSON` merges numeric overrides then renormalizes (A/B + continuous tuning).
 */
export function getMarketplaceRankingWeights(cohort?: string | null): {
  weights: MarketplaceRankingWeights;
  presetKey: string;
} {
  const key = (
    cohort ??
    process.env.BNHUB_RANKING_EXPERIMENT ??
    process.env.RANKING_ALGO_COHORT ??
    "baseline"
  )
    .trim()
    .toLowerCase();
  const base = PRESETS[key] ?? MARKETPLACE_RANKING_WEIGHTS_BASELINE;
  const envOverlay = tryParseBnhubWeightsEnv();
  const merged = envOverlay ? ({ ...base, ...envOverlay } as MarketplaceRankingWeights) : base;
  const weights = normalizeWeights(merged);
  const presetKey = PRESETS[key] ? key : "baseline";
  return { weights, presetKey: envOverlay ? `${presetKey}+json` : presetKey };
}
