import type { RankingScoreResult, RankingSearchContext } from "@/src/modules/ranking/types";
import type { RankingListingType } from "@/src/modules/ranking/dataMap";
import {
  recomputeRankingForListing,
  recomputeAllRankingScores,
} from "@/src/modules/ranking/rankingService";
import { computeRealEstateRankingScore } from "@/src/modules/ranking/scoringEngine";
import type { FsboListingRankingInput } from "@/src/modules/ranking/types";
import { performanceBandFromTotalScore, publicBandLabel, type PerformanceBand } from "./ranking.labels";
import { scaleTo100 } from "./normalize";
import { TOP_LISTING_PUBLIC_SCORE_THRESHOLD } from "./constants";

export { computeFsboListingQualityV1 } from "./quality.v1";
export { computeFsboPriceCompetitivenessV1, priceScoreToSignal01 } from "./price-competitiveness.v1";
export { conversionLikelihoodProxy01 } from "./scoring";

/** Single listing recompute + persist (FSBO or BNHub). */
export async function calculateListingRanking(
  listingType: RankingListingType,
  listingId: string,
  ctx: Partial<RankingSearchContext> = {}
): Promise<RankingScoreResult | null> {
  return recomputeRankingForListing(listingType, listingId, ctx);
}

export async function calculateRankingForFsboListing(
  input: FsboListingRankingInput,
  ctx: RankingSearchContext
): Promise<RankingScoreResult> {
  return computeRealEstateRankingScore(input, ctx);
}

export async function recalculateRankingsBatch(listingType?: RankingListingType): Promise<{ bnhub: number; realEstate: number }> {
  return recomputeAllRankingScores(listingType);
}

export type PublicRankingBadges = {
  performanceBandLabel?: string;
  showTopListing?: boolean;
  trustBadge?: string;
  qualityBadge?: string;
};

/**
 * Safe, minimal metadata for cards — never exposes raw sub-scores unless you opt in via `includeScoreHints`.
 */
export function attachRankingMetadata(
  row: {
    rankingTotalScoreCache?: number;
    rankingPerformanceBand?: string | null;
    trustScore?: number | null;
  },
  opts?: { includeScoreHints?: boolean }
): PublicRankingBadges {
  const total = row.rankingTotalScoreCache ?? 0;
  const band = (row.rankingPerformanceBand as PerformanceBand | null) ?? performanceBandFromTotalScore(total);
  const out: PublicRankingBadges = {
    performanceBandLabel: publicBandLabel(band),
    showTopListing: total >= TOP_LISTING_PUBLIC_SCORE_THRESHOLD,
  };
  if (opts?.includeScoreHints) {
    if (row.trustScore != null && row.trustScore >= 70) {
      out.trustBadge = "Verified trust";
    }
  }
  return out;
}

/** Map persisted 0–1 component to UI 0–100 for internal tools. */
export function componentForAdminDisplay(component01: number | null | undefined): number {
  return scaleTo100(component01);
}
