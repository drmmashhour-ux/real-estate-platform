import type { RankingListingType } from "@/src/modules/ranking/dataMap";
import { RANKING_LISTING_TYPE_BNHUB, RANKING_LISTING_TYPE_REAL_ESTATE } from "@/src/modules/ranking/dataMap";
import type { RankingSearchContext, RankingSignalBundle } from "@/src/modules/ranking/types";
import { buildBnhubSignalBundle, buildFsboSignalBundle } from "@/src/modules/ranking/signalEngine";
import type { BnhubListingRankingInput, FsboListingRankingInput } from "@/src/modules/ranking/types";
import { ensureSignalDefaults } from "./ranking-fallbacks";
import { blendRankingV2Score, buildV2Breakdown } from "./scoring";
import { explainRankingV2 } from "./ranking.explainer";
import type { RankingDomain, RankingV2Explain } from "./ranking.types";

function domainForListingType(t: RankingListingType): RankingDomain {
  if (t === RANKING_LISTING_TYPE_BNHUB) return "bnhub";
  return "listings";
}

export function computeRankingV2FromSignals(params: {
  listingType: RankingListingType;
  listingId: string;
  signals: RankingSignalBundle;
  featuredActive: boolean;
  domainOverride?: RankingDomain;
}): { score0to100: number; explanation: RankingV2Explain } {
  const domain = params.domainOverride ?? domainForListingType(params.listingType);
  const s = ensureSignalDefaults(params.signals);
  const breakdown = buildV2Breakdown(s, params.featuredActive);
  const score = blendRankingV2Score(domain, breakdown);
  const explanation = explainRankingV2(score, breakdown, { featuredActive: params.featuredActive });
  return { score0to100: score, explanation };
}

export function computeFsboRankingV2(
  listing: FsboListingRankingInput,
  ctx: RankingSearchContext,
  featuredUntil: Date | null
): { score0to100: number; explanation: RankingV2Explain } {
  const signals = buildFsboSignalBundle(listing, ctx);
  const featuredActive = !!(featuredUntil && featuredUntil > new Date());
  return computeRankingV2FromSignals({
    listingType: RANKING_LISTING_TYPE_REAL_ESTATE,
    listingId: listing.id,
    signals,
    featuredActive,
  });
}

export function computeBnhubRankingV2(
  listing: BnhubListingRankingInput,
  ctx: RankingSearchContext,
  featuredActive: boolean
): { score0to100: number; explanation: RankingV2Explain } {
  const signals = buildBnhubSignalBundle(listing, ctx);
  return computeRankingV2FromSignals({
    listingType: RANKING_LISTING_TYPE_BNHUB,
    listingId: listing.id,
    signals,
    featuredActive,
  });
}
