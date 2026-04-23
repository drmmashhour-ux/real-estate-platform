/**
 * Darlink AI — central flags, weights, thresholds (Syria app only).
 * No scattered magic numbers in services; import from here.
 */
function envBool(key: string, defaultVal: boolean): boolean {
  const v = process.env[key];
  if (v === undefined || v === "") return defaultVal;
  return v === "true" || v === "1";
}

function envNum(key: string, fallback: number): number {
  const v = process.env[key];
  if (v === undefined || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export const darlinkAiConfig = {
  enabled: envBool("DARLINK_AI_ENABLED", true),
  copyAssistEnabled: envBool("DARLINK_AI_COPY_ASSIST_ENABLED", true),
  pricingEnabled: envBool("DARLINK_AI_PRICING_ENABLED", true),
  investmentEnabled: envBool("DARLINK_AI_INVESTMENT_ENABLED", true),
  mapIntelligenceEnabled: envBool("DARLINK_AI_MAP_INTELLIGENCE_ENABLED", true),
  growthEnabled: envBool("DARLINK_AI_GROWTH_ENABLED", true),
  rankingExplainEnabled: envBool("DARLINK_AI_RANKING_EXPLAIN_ENABLED", true),

  /** Pricing suggestion clamps: max deviation from peer median (ratio). */
  pricing: {
    maxDeviationRatio: envNum("DARLINK_AI_PRICING_MAX_DEVIATION_RATIO", 0.35),
    minPeerListings: envNum("DARLINK_AI_PRICING_MIN_PEER_LISTINGS", 3),
    nightlyClampRatio: envNum("DARLINK_AI_NIGHTLY_CLAMP_RATIO", 0.4),
  },

  /** Explainable ranking weights (sum need not be 100; normalized in service). */
  ranking: {
    wQuality: envNum("DARLINK_AI_RANK_W_QUALITY", 1),
    wPriceCompetitiveness: envNum("DARLINK_AI_RANK_W_PRICE", 1),
    wLocation: envNum("DARLINK_AI_RANK_W_LOCATION", 1),
    wEngagement: envNum("DARLINK_AI_RANK_W_ENGAGEMENT", 0.6),
    wRecency: envNum("DARLINK_AI_RANK_W_RECENCY", 0.5),
    wFeatured: envNum("DARLINK_AI_RANK_W_FEATURED", 2),
    wTrustPublished: envNum("DARLINK_AI_RANK_W_TRUST", 0.5),
  },

  investment: {
    minConfidenceToShowBadge: envNum("DARLINK_AI_INVESTMENT_MIN_CONFIDENCE", 0.45),
    undervaluedRatioThreshold: envNum("DARLINK_AI_INVESTMENT_UNDERVALUE_RATIO", 0.18),
  },

  map: {
    nearbyDefaultRadiusKm: envNum("DARLINK_AI_NEARBY_RADIUS_KM", 8),
    hotZoneGridDegrees: envNum("DARLINK_AI_HOTZONE_GRID_DEG", 0.08),
    popularAreasLimit: envNum("DARLINK_AI_POPULAR_AREAS_LIMIT", 12),
  },

  growth: {
    staleListingDays: envNum("DARLINK_AI_STALE_LISTING_DAYS", 45),
    highTrafficViewThreshold: envNum("DARLINK_AI_HIGH_TRAFFIC_VIEWS", 50),
  },
} as const;

export function isDarlinkAiEnabled(): boolean {
  return darlinkAiConfig.enabled;
}
