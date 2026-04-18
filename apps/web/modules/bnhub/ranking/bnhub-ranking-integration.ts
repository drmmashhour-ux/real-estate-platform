import { getActivePromotedListingIds } from "@/lib/promotions";
import { bnhubV2Flags } from "@/config/feature-flags";
import { BNHUB_RANKING_FEATURED_BOOST_MAX } from "@/config/bnhub-ranking-pricing.config";
import { loadBnhubRankingSignalsBatch, type ListingRowForRankingSignals } from "./bnhub-ranking-signals.service";
import {
  compareBnhubRanking,
  computeBnhubRankingScore,
} from "./bnhub-ranking.service";
import type { BnhubRankingScore, BnhubSortMode } from "./bnhub-ranking.types";
import { recordBnhubRankingCalculated } from "./bnhub-ranking-monitor";

export function mapSearchSortToBnhubMode(sort: string | undefined): BnhubSortMode {
  switch (sort) {
    case "priceAsc":
      return "price_low_high";
    case "priceDesc":
      return "price_high_low";
    case "newest":
      return "newest";
    case "best_value":
      return "best_value";
    case "top_conversion":
    case "ranking":
      return "top_conversion";
    case "recommended":
    case "ai":
    case "aiScore":
    default:
      return "recommended";
  }
}

const RANK_SORTS = new Set([
  "recommended",
  "ai",
  "aiScore",
  "best_value",
  "top_conversion",
  "ranking",
]);

type ListingWithOwner = ListingRowForRankingSignals;

/**
 * Re-order stays search results using BNHub ranking V1 (deterministic).
 * No-op when flag off or wrong sort mode.
 */
export async function applyBnhubStaysRanking<T extends ListingWithOwner & { nightPriceCents: number }>(
  listings: T[],
  args: { sort: string | undefined; attachMeta?: boolean },
): Promise<T[]> {
  if (!bnhubV2Flags.bnhubRankingV1 || listings.length <= 1) return listings;
  const sort = args.sort ?? "recommended";
  if (!RANK_SORTS.has(sort)) return listings;

  const mode = mapSearchSortToBnhubMode(sort);
  const signalMap = await loadBnhubRankingSignalsBatch(listings);
  const promoted = await getActivePromotedListingIds({ placement: "FEATURED", limit: 40 });
  const promoSet = new Set(promoted);

  const scores = new Map<string, BnhubRankingScore>();
  for (const l of listings) {
    const sig = signalMap.get(l.id);
    if (!sig) continue;
    const boost = promoSet.has(l.id) ? BNHUB_RANKING_FEATURED_BOOST_MAX : 0;
    scores.set(l.id, computeBnhubRankingScore(l.id, sig, boost));
  }

  const ranked = [...listings].sort((a, b) => {
    const sa = scores.get(a.id);
    const sb = scores.get(b.id);
    if (!sa || !sb) return 0;
    return compareBnhubRanking(sa, sb, mode, a.nightPriceCents, b.nightPriceCents);
  });

  if (promoted.length > 0) {
    const pr = ranked.filter((l) => promoSet.has(l.id));
    const rest = ranked.filter((l) => !promoSet.has(l.id));
    const order = [...promoted];
    const reordered = [...pr]
      .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))
      .concat(rest);
    recordBnhubRankingCalculated(reordered.length, { mode, featuredInterleave: true });
    return attachMetaToListings(reordered, scores, args.attachMeta);
  }

  recordBnhubRankingCalculated(ranked.length, { mode });
  return attachMetaToListings(ranked, scores, args.attachMeta);
}

function attachMetaToListings<T extends { id: string }>(
  listings: T[],
  scores: Map<string, BnhubRankingScore>,
  attach?: boolean,
): T[] {
  if (!attach) return listings;
  return listings.map((l) => {
    const r = scores.get(l.id);
    if (!r) return l;
    return {
      ...l,
      bnhubRankingScore: r.finalScore,
      bnhubRankingBreakdown: r.signalBreakdown,
      bnhubRankingExplanations: r.explanations,
    } as T;
  });
}
