import type { RankingListingType } from "@/src/modules/ranking/dataMap";
import type { RankingSignalBundle, RankingSearchContext } from "@/src/modules/ranking/types";

/** Domain-specific weight profiles (sum to 1). */
export type RankingDomain = "listings" | "bnhub" | "investor_collections";

export type RankingV2SignalBreakdown01 = {
  relevance: number;
  recency: number;
  trust: number;
  quality: number;
  priceCompetitiveness: number;
  engagement: number;
  conversion: number;
  liquidity: number;
  featuredBoost: number;
};

export type RankingV2Explain = {
  rankingScore: number;
  topReasons: string[];
  signalBreakdown: RankingV2SignalBreakdown01;
  warnings: string[];
};

export type RankingV2ComputeInput = {
  listingType: RankingListingType;
  listingId: string;
  signals: RankingSignalBundle;
  ctx: RankingSearchContext;
  /** Active featured monetization window */
  featuredActive: boolean;
};
