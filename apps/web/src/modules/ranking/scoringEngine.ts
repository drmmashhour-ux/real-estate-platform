import { prisma } from "@/lib/db";
import { isAiRankingExplanationsEnabled } from "@/src/modules/ranking/rankingEnv";
import {
  RANKING_LISTING_TYPE_BNHUB,
  RANKING_LISTING_TYPE_CRM,
  RANKING_LISTING_TYPE_REAL_ESTATE,
  type RankingListingType,
} from "@/src/modules/ranking/dataMap";
import { buildBnhubSignalBundle, buildFsboSignalBundle } from "@/src/modules/ranking/signalEngine";
import type {
  RankingExplanation,
  RankingScoreResult,
  RankingSearchContext,
  RankingSignalBundle,
  BnhubListingRankingInput,
  FsboListingRankingInput,
} from "@/src/modules/ranking/types";

const CONFIG_KEYS: Record<RankingListingType, string> = {
  bnhub: "default_bnhub_ranking",
  real_estate: "default_real_estate_ranking",
  lecipm_crm: "default_lecipm_crm_ranking",
};

export type RankingWeights = Record<string, number>;

const SIGNAL_KEYS = [
  "relevance",
  "trust",
  "quality",
  "engagement",
  "conversion",
  "freshness",
  "host",
  "review",
  "priceCompetitiveness",
  "availability",
] as const;

export async function loadActiveRankingConfig(listingType: RankingListingType): Promise<RankingWeights> {
  const key = CONFIG_KEYS[listingType];
  const row = await prisma.rankingConfig.findFirst({
    where: { configKey: key, isActive: true },
  });
  if (!row?.weightsJson || typeof row.weightsJson !== "object") {
    return getDefaultWeightsForType(listingType);
  }
  const j = row.weightsJson as Record<string, unknown>;
  const out: RankingWeights = {};
  for (const k of SIGNAL_KEYS) {
    const v = j[k];
    if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
  }
  return Object.keys(out).length > 0 ? out : getDefaultWeightsForType(listingType);
}

/** Uses `ctx.rankingConfigKey` when set and active; otherwise default config for listing type. */
export async function loadRankingWeightsForContext(
  listingType: RankingListingType,
  ctx: RankingSearchContext,
  cached?: RankingWeights
): Promise<RankingWeights> {
  if (cached) return cached;
  const overrideKey = ctx.rankingConfigKey?.trim();
  if (overrideKey) {
    const row = await prisma.rankingConfig.findFirst({
      where: { configKey: overrideKey, isActive: true },
    });
    if (row?.weightsJson && typeof row.weightsJson === "object") {
      const j = row.weightsJson as Record<string, unknown>;
      const out: RankingWeights = {};
      for (const k of SIGNAL_KEYS) {
        const v = j[k];
        if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
      }
      if (Object.keys(out).length > 0) return out;
    }
  }
  return loadActiveRankingConfig(listingType);
}

function getDefaultWeightsForType(listingType: RankingListingType): RankingWeights {
  if (listingType === RANKING_LISTING_TYPE_BNHUB) {
    return {
      relevance: 0.22,
      trust: 0.14,
      quality: 0.1,
      engagement: 0.08,
      conversion: 0.12,
      freshness: 0.07,
      host: 0.12,
      review: 0.1,
      priceCompetitiveness: 0.03,
      availability: 0.02,
    };
  }
  if (listingType === RANKING_LISTING_TYPE_REAL_ESTATE) {
    return {
      relevance: 0.24,
      trust: 0.16,
      quality: 0.14,
      engagement: 0.12,
      conversion: 0.14,
      freshness: 0.08,
      host: 0.02,
      review: 0.02,
      priceCompetitiveness: 0.06,
      availability: 0.02,
    };
  }
  return {
    relevance: 0.2,
    trust: 0.1,
    quality: 0.08,
    engagement: 0.06,
    conversion: 0.06,
    freshness: 0.15,
    host: 0.05,
    review: 0.05,
    priceCompetitiveness: 0.15,
    availability: 0.1,
  };
}

export function blendScores(signals: RankingSignalBundle, weights: RankingWeights): number {
  let num = 0;
  let den = 0;
  for (const k of SIGNAL_KEYS) {
    const w = weights[k] ?? 0;
    if (w <= 0) continue;
    num += w * signals[k];
    den += w;
  }
  if (den <= 0) return 0;
  return (num / den) * 100;
}

export function buildRankingExplanation(
  signals: RankingSignalBundle,
  weights: RankingWeights
): RankingExplanation {
  const contrib = SIGNAL_KEYS.map((k) => ({
    k,
    c: (weights[k] ?? 0) * signals[k],
    s: signals[k],
  })).filter((x) => (weights[x.k] ?? 0) > 0);

  const pos = [...contrib].filter((x) => x.s >= 0.72).sort((a, b) => b.c - a.c);
  const neg = [...contrib].filter((x) => x.s < 0.45).sort((a, b) => a.c - b.c);

  const missing: string[] = [];
  if (signals.review < 0.42) missing.push("limited_review_signal");
  if (signals.engagement < 0.35) missing.push("low_engagement_history");
  if (signals.trust < 0.45) missing.push("trust_incomplete");

  const boosts: string[] = [];
  if (signals.host >= 0.85) boosts.push("strong_host_metrics");
  if (signals.relevance >= 0.95) boosts.push("high_query_match");

  const caps: string[] = [];
  if (signals.availability < 0.2) caps.push("availability_penalty");

  return {
    topPositive: pos.slice(0, 5).map((x) => `${x.k}:${x.s.toFixed(2)}`),
    topNegative: neg.slice(0, 5).map((x) => `${x.k}:${x.s.toFixed(2)}`),
    missingData: missing,
    boosts,
    caps,
  };
}

function toScoreFields(signals: RankingSignalBundle): Omit<RankingScoreResult, "listingType" | "listingId" | "weightsUsed" | "explanation" | "city" | "neighborhood"> {
  return {
    totalScore: 0,
    relevanceScore: signals.relevance,
    trustScore: signals.trust,
    qualityScore: signals.quality,
    engagementScore: signals.engagement,
    conversionScore: signals.conversion,
    freshnessScore: signals.freshness,
    hostScore: signals.host,
    reviewScore: signals.review,
    priceCompetitivenessScore: signals.priceCompetitiveness,
    availabilityScore: signals.availability,
    signals,
  };
}

export async function computeBnhubRankingScore(
  listing: BnhubListingRankingInput,
  ctx: RankingSearchContext,
  cachedWeights?: RankingWeights
): Promise<RankingScoreResult> {
  const weights = cachedWeights ?? (await loadActiveRankingConfig(RANKING_LISTING_TYPE_BNHUB));
  const signals = buildBnhubSignalBundle(listing, ctx);
  const total = blendScores(signals, weights);
  const base = toScoreFields(signals);
  const explanation =
    isAiRankingExplanationsEnabled() ? buildRankingExplanation(signals, weights) : undefined;
  return {
    listingType: RANKING_LISTING_TYPE_BNHUB,
    listingId: listing.id,
    city: listing.city,
    neighborhood: listing.region,
    ...base,
    totalScore: total,
    weightsUsed: { ...weights },
    explanation,
  };
}

export async function computeRealEstateRankingScore(
  listing: FsboListingRankingInput,
  ctx: RankingSearchContext,
  cachedWeights?: RankingWeights
): Promise<RankingScoreResult> {
  const weights = await loadRankingWeightsForContext(RANKING_LISTING_TYPE_REAL_ESTATE, ctx, cachedWeights);
  const signals = buildFsboSignalBundle(listing, ctx);
  const total = blendScores(signals, weights);
  const base = toScoreFields(signals);
  const explanation =
    isAiRankingExplanationsEnabled() ? buildRankingExplanation(signals, weights) : undefined;
  return {
    listingType: RANKING_LISTING_TYPE_REAL_ESTATE,
    listingId: listing.id,
    city: listing.city,
    neighborhood: null,
    ...base,
    totalScore: total,
    weightsUsed: { ...weights },
    explanation,
  };
}

/** Thin wrapper: dispatches by listing type */
export async function computeListingRankingScore(
  listingType: RankingListingType,
  listing: BnhubListingRankingInput | FsboListingRankingInput,
  ctx: RankingSearchContext
): Promise<RankingScoreResult> {
  if (listingType === RANKING_LISTING_TYPE_BNHUB) {
    return computeBnhubRankingScore(listing as BnhubListingRankingInput, ctx);
  }
  if (listingType === RANKING_LISTING_TYPE_CRM) {
    throw new Error("CRM listing ranking is not wired; use FSBO or BNHub inputs.");
  }
  return computeRealEstateRankingScore(listing as FsboListingRankingInput, ctx);
}
