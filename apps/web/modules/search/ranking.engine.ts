/**
 * BNHub marketplace ranking facade — explainable factors, configurable weights, no pay-to-win manipulation.
 * Core math: `lib/marketplace-ranking/ranking-algorithm.engine.ts`.
 */
import type { BnhubListingForRanking } from "@/lib/ai/bnhub-search";
import {
  buildRankingContextPayload,
  rankListingsAlgorithm,
  type RankableListingInput,
} from "@/lib/marketplace-ranking/ranking-algorithm.engine";
import type { ListingRankingBreakdown } from "@/lib/marketplace-ranking/ranking.types";
import type { MemoryRankHint } from "@/lib/marketplace-memory/memory-ranking-hint";
import type { RankingSortIntent } from "@/lib/marketplace-ranking/ranking.types";

/** Public, stable names for UI / audits (map to internal subscores). */
export type ListingRankFactorBreakdown = {
  priceCompetitiveness: number;
  listingQuality: number;
  reviewsAndTrust: number;
  availabilityAndBookingFit: number;
  conversionPerformance: number;
  responseTime: number;
  freshnessExploration: number;
  /** Plain-language lines (no fake urgency). */
  explain: string[];
};

export type BnhubSearchRankingContext = {
  userId?: string | null;
  city?: string | null;
  checkIn?: string | null;
  checkOut?: string | null;
  guests?: number | null;
  priceMin?: number | null;
  priceMax?: number | null;
  propertyType?: string | null;
  searchQuery?: string | null;
  sortIntent?: RankingSortIntent;
  /** A/B cohort: `bookings_max_v1`, `baseline`, `test_trust`, or custom preset key. */
  experimentCohort?: string | null;
  memoryHint?: MemoryRankHint | null;
  /** Optional per-listing 0–1 scores from guest-facing AI (bounded inside the algorithm). */
  guestAiListingAffinity?: Map<string, number> | null;
  promotedListingIds?: Set<string> | null;
};

export type RankedListingWithMeta<T extends RankableListingInput = RankableListingInput> = T & {
  _rankingPosition: number;
  _listingScore: number;
  _rankingBreakdown?: ListingRankingBreakdown;
  _factorBreakdown?: ListingRankFactorBreakdown;
};

export function mapListingRowToRankable(row: BnhubListingForRanking & {
  owner?: {
    hostPerformanceMetrics?: {
      avgResponseTime?: number | null;
      cancellationRate?: number | null;
    } | null;
  } | null;
}): RankableListingInput {
  const m = row.owner?.hostPerformanceMetrics;
  return {
    ...row,
    hostAvgResponseHours: m?.avgResponseTime ?? null,
    hostCancellationRate: m?.cancellationRate ?? null,
  };
}

/** Map internal signals to product “factor” language (all 0–1). */
export function toPublicFactorBreakdown(br: ListingRankingBreakdown): ListingRankFactorBreakdown {
  const s = br.signals;
  const convBlend = Math.min(1, Math.max(0, s.closeProbabilityScore * 0.5 + s.bookingProbabilityScore * 0.5));
  return {
    priceCompetitiveness: s.priceFitScore,
    listingQuality: s.qualityScore,
    reviewsAndTrust: s.trustScore,
    availabilityAndBookingFit: s.bookingProbabilityScore,
    conversionPerformance: convBlend,
    responseTime: s.responseSpeedScore,
    freshnessExploration: s.freshnessScore,
    explain: [...br.explain],
  };
}

export type RankListingsResult<T extends RankableListingInput> = {
  listings: RankedListingWithMeta<T>[];
  weightsPresetKey: string;
  contextHash: string;
};

export type RankListingsOptions = {
  /** When true, attaches `_rankingBreakdown` and `_factorBreakdown` (for transparency tooling). */
  attachExplainBreakdown?: boolean;
};

/**
 * Sort listings for BNHub search using the marketplace ranking engine; returns scores and explanations.
 */
export function rankListings<T extends RankableListingInput>(
  listings: T[],
  context: BnhubSearchRankingContext,
  options?: RankListingsOptions
): RankListingsResult<T> {
  if (listings.length === 0) {
    return { listings: [], weightsPresetKey: "none", contextHash: "" };
  }

  const rankingCtx = buildRankingContextPayload(
    {
      location: context.city ?? undefined,
      checkIn: context.checkIn ?? undefined,
      checkOut: context.checkOut ?? undefined,
      guests: context.guests ?? undefined,
      minPrice: context.priceMin ?? undefined,
      maxPrice: context.priceMax ?? undefined,
      propertyType: context.propertyType ?? undefined,
    },
    {
      userId: context.userId ?? null,
      searchQuery: context.searchQuery ?? null,
      sortIntent: context.sortIntent ?? "RELEVANCE",
      marketSegment: "SHORT_TERM",
    }
  );

  const out: RankListingsAlgorithmOutput<T> = rankListingsAlgorithm(rankingCtx, listings, {
    memoryHint: context.memoryHint ?? null,
    promotedIds: context.promotedListingIds ?? null,
    cohort: context.experimentCohort ?? null,
    guestAiListingAffinity: context.guestAiListingAffinity ?? null,
  });

  const attach = options?.attachExplainBreakdown === true;
  const listingsOut: RankedListingWithMeta<T>[] = out.ranked.map((r, idx) => {
    const row: RankedListingWithMeta<T> = {
      ...(r.listing as T),
      _rankingPosition: idx + 1,
      _listingScore: r.breakdown.totalScore,
    };
    if (attach) {
      row._rankingBreakdown = r.breakdown;
      row._factorBreakdown = toPublicFactorBreakdown(r.breakdown);
    }
    return row;
  });

  return {
    listings: listingsOut,
    weightsPresetKey: out.weightsPresetKey,
    contextHash: out.contextHash,
  };
}

export function logListingSearchRankingTelemetry(
  items: Array<{ listingId: string; ranking_position: number; listing_score: number }>,
  meta: { weightsPresetKey: string; contextHash: string; source: string }
): void {
  console.info(
    "[ranking]",
    JSON.stringify({
      ...meta,
      items,
    })
  );
}
