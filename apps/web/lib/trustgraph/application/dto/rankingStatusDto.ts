import type { ListingRankingInternal } from "@/lib/trustgraph/infrastructure/services/listingRankingBoostService";

export type ListingRankingStatusSafeDto = {
  listingId: string;
  publicBadgeReasons: string[];
  trustBoostScore: number;
  finalRankingScore: number;
};

export type ListingRankingStatusAdminDto = ListingRankingStatusSafeDto & {
  baseRankingScore: number;
  rankingReasons: string[];
};

export function toListingRankingStatusDtos(
  internal: ListingRankingInternal,
  opts: { includeAdmin: boolean }
): { safe: ListingRankingStatusSafeDto; admin?: ListingRankingStatusAdminDto } {
  const safe: ListingRankingStatusSafeDto = {
    listingId: internal.listingId,
    publicBadgeReasons: internal.publicBadgeReasons,
    trustBoostScore: internal.trustBoostScore,
    finalRankingScore: internal.finalRankingScore,
  };
  if (!opts.includeAdmin) return { safe };
  return {
    safe,
    admin: {
      ...safe,
      baseRankingScore: internal.baseRankingScore,
      rankingReasons: internal.rankingReasons,
    },
  };
}
