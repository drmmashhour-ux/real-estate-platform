import { revenueV4Flags } from "@/config/feature-flags";
import type { FsboListingRankingInput, BnhubListingRankingInput } from "@/src/modules/ranking/types";
import type { RankScoreComponents } from "@/lib/ranking/compute-rank-score";
import { REVENUE_RANKING_BLEND_MAX_POINTS, REVENUE_RANKING_WEIGHT_ENV } from "./revenue.constants";

function weightFromEnv(): number {
  const w = Number(process.env[REVENUE_RANKING_WEIGHT_ENV] ?? "1.2");
  return Number.isFinite(w) && w > 0 ? Math.min(3, w) : 1.2;
}

/**
 * Small capped boost from monetization proxies — skipped for low-trust / thin listings.
 */
export function applyRevenueRankingBlendFsbo(
  final0to100: number,
  listing: FsboListingRankingInput,
  components: RankScoreComponents,
): number {
  if (!revenueV4Flags.revenueEngineV1 || !revenueV4Flags.revenueRankingBlendV1) return final0to100;

  if (components.trust_score < 0.38 || components.quality_score < 0.32) return final0to100;

  let revenue01 = 0.2;
  const featured = listing.featuredUntil != null && listing.featuredUntil > new Date();
  if (featured) revenue01 += 0.35;
  if (listing.leadCount >= 2) revenue01 += 0.2;
  if (listing.viewCount > 30) revenue01 += 0.15;
  revenue01 = Math.min(1, revenue01);

  const add = Math.min(REVENUE_RANKING_BLEND_MAX_POINTS, weightFromEnv() * revenue01);
  return Math.min(100, final0to100 + add);
}

export function applyRevenueRankingBlendBnhub(
  final0to100: number,
  input: BnhubListingRankingInput,
  components: RankScoreComponents,
): number {
  if (!revenueV4Flags.revenueEngineV1 || !revenueV4Flags.revenueRankingBlendV1) return final0to100;

  if (components.trust_score < 0.38 || components.quality_score < 0.3) return final0to100;

  let revenue01 = 0.15;
  if (input.completedBookings >= 5) revenue01 += 0.35;
  if (input.reputationRankBoost > 0) revenue01 += 0.15;
  if ((input.platformListingTrust01 ?? 0) > 0.65) revenue01 += 0.2;
  revenue01 = Math.min(1, revenue01);

  const add = Math.min(REVENUE_RANKING_BLEND_MAX_POINTS, weightFromEnv() * revenue01 * 0.85);
  return Math.min(100, final0to100 + add);
}
