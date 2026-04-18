import { prisma } from "@/lib/db";
import { GrowthEventName } from "@/modules/growth/event-types";
import { recordGrowthEvent } from "@/modules/growth/tracking.service";
import { BnhubDayAvailabilityStatus, ListingStatus, type LoyaltyTier, type Prisma } from "@prisma/client";
import type { BnhubListingForRanking } from "@/lib/ai/bnhub-search";
import { allocateUniqueLSTListingCode } from "@/lib/listing-code";
import { normalizeAnyPublicListingCode } from "@/lib/listing-code-public";
import { attachIntegerAiScoresToBnhubSearchResults } from "@/lib/bnhub/discovery-ai-score";
import { applyBehaviorLearningToBnhubSearchResults } from "@/lib/learning/applyBehaviorLearningRank";
import { scoreListingForSearch } from "./ranking/listing-ranking";
import type { ListingSearchRankContext } from "./ranking/listing-ranking";
import { getMarketingSearchBoostByListingId } from "@/src/modules/bnhub-marketing/services/marketingFeaturedSearchBridge";
import { getGrowthSearchBoostByListingId } from "@/src/modules/bnhub-growth-engine/services/growthFeaturedBridge";
import { getClassificationSearchBoostMapForIds } from "@/src/modules/bnhub-growth-engine/services/propertyClassificationService";
import {
  scheduleBnhubListingEngineRefresh,
  shouldScheduleFullEngineRecompute,
} from "@/src/modules/bnhub-growth-engine/services/bnhubListingEnginesOrchestrator";
import { scheduleFraudRecheck } from "@/src/workers/fraudDetectionWorker";
import { emitPlatformAutonomyEvent } from "@/lib/autonomy/emit-platform-event";
import { enqueueHostAutopilot } from "@/lib/ai/autopilot/triggers";
import { getActivePromotedListingIds } from "@/lib/promotions";
import { getApprovedHost, hasAcceptedHostAgreement } from "./host";
import { buildPublishedListingSearchWhere, searchOrderBy } from "./build-search-where";
import { applyStaysFilters, hasActiveStaysFilters, type StaysSearchFilters } from "@/lib/bnhub/stays-filters";
import { geocodeAddressLine } from "@/lib/geo/geocode-nominatim";
import { listingQualityBadgeLabelFromRow } from "@/lib/quality/validators";
import {
  getListingQualitySearchAdjustMapForIds,
  getLuxuryTierSearchBoostMapForIds,
  getPlatformTrustSearchBoostMapForListings,
  getReputationSearchAdjustMapForListings,
  getTrustRiskPenaltyMapForIds,
} from "@/lib/bnhub/bnhubSearchRankSignals";
import { isAiRankingEngineEnabled } from "@/src/modules/ranking/rankingEnv";
import {
  maybeLogBnhubSearchImpressions,
  orderBnhubListingsByRankingEngine,
} from "@/src/modules/ranking/rankingService";
import {
  expireStaleBnhubPendingBookings,
  findOverlappingActiveBnhubBooking,
} from "@/lib/bookings/checkAvailability";
import { applyAiSearchRankingToBnhubResults } from "@/lib/ai/search/applyAiSearchRanking";
import { getWinnerSearchBoostMapForIds } from "@/lib/bnhub/winner-search-boost";

export type ListingSearchParams = {
  city?: string;
  /** Exact public listing code search (e.g. LEC-10001). */
  listingCode?: string;
  checkIn?: string; // ISO date
  checkOut?: string; // ISO date
  minPrice?: number;
  maxPrice?: number;
  guests?: number;
  verifiedOnly?: boolean;
  propertyType?: string;
  roomType?: string;
  instantBook?: boolean;
  minBeds?: number;
  minBaths?: number;
  centerLat?: number;
  centerLng?: number;
  radiusKm?: number;
  /** newest | priceAsc | priceDesc | recommended | popular */
  sort?: string;
  page?: number;
  limit?: number;
  /** BNHUB — listing `amenities` JSON must match these (e.g. wifi → WiFi). */
  amenitySlugs?: string[];
  /** Map bbox (all four, WGS84). */
  north?: number;
  south?: number;
  east?: number;
  west?: number;
  /** Description/title keyword filters (waterfront, hot_tub, self_checkin). */
  discoveryFeatures?: string[];
  /** Lifestyle / pets / experience / services (BNHUB stays). */
  staysFilters?: StaysSearchFilters | null;
  /** When true (default), background-geocode rows missing coordinates (rate-limited). */
  geocodeMissingCoordinates?: boolean;
  /** Logged-in guest — enables personalized AI ranking for recommended / ai sort. */
  userId?: string | null;
  /** Cookie `lecipm_behavior_sid` — optional behavior-learning personalization. */
  sessionId?: string | null;
};

/** Maps filter keys to substrings matched against `ShortTermListing.amenities` JSON strings. */
const AMENITY_SLUG_TO_MATCHERS: Record<string, string[]> = {
  wifi: ["wifi"],
  kitchen: ["kitchen"],
  ac: ["ac", "air condition"],
  parking: ["parking"],
  washer: ["washer", "laundry"],
  pet_friendly: ["pet"],
};

function listingMatchesAmenitySlugs(amenitiesJson: unknown, slugs: string[]): boolean {
  if (!slugs.length) return true;
  const arr = Array.isArray(amenitiesJson) ? amenitiesJson : [];
  const strings = arr.filter((x): x is string => typeof x === "string").map((s) => s.toLowerCase());
  if (strings.length === 0) return false;
  return slugs.every((slug) => {
    const matchers = AMENITY_SLUG_TO_MATCHERS[slug] ?? [slug.replace(/_/g, " ")];
    return matchers.some((m) => strings.some((s) => s.includes(m.toLowerCase())));
  });
}

function listingMatchesDiscovery(
  listing: { description?: string | null; title?: string | null; amenities?: unknown },
  key: string
): boolean {
  const blob = `${listing.description ?? ""} ${listing.title ?? ""}`.toLowerCase();
  const am = JSON.stringify(listing.amenities ?? []).toLowerCase();
  if (key === "waterfront") {
    return blob.includes("waterfront") || blob.includes("water front") || am.includes("waterfront");
  }
  if (key === "hot_tub") {
    return blob.includes("hot tub") || blob.includes("hottub") || blob.includes("jacuzzi") || am.includes("hot tub");
  }
  if (key === "self_checkin") {
    return (
      (blob.includes("self") && blob.includes("check")) ||
      blob.includes("self-check") ||
      blob.includes("keyless")
    );
  }
  return false;
}

type SearchListingWithReviewAvg<T extends { id: string }> = T & {
  reviews: { propertyRating: number }[];
  /** 0–1 from cached `listing_quality_scores.quality_score`, when present. */
  cachedListingQuality01: number | null;
  /** Short label for result cards when quality thresholds are met. */
  qualityBadgeLabel: string | null;
};

/**
 * Search/ranking only needs average review stars, not every Review row.
 * Returns copies with a one-element `reviews` array whose rating equals the DB average so
 * marketplace ranking and client `getRating()` stay unchanged.
 */
export async function attachReviewAggregatesForSearch<T extends { id: string }>(
  listings: T[]
): Promise<SearchListingWithReviewAvg<T>[]> {
  if (listings.length === 0) return [];
  const ids = listings.map((l) => l.id);
  const [grouped, qualityRows] = await Promise.all([
    prisma.review.groupBy({
      by: ["listingId"],
      where: { listingId: { in: ids } },
      _avg: { propertyRating: true },
    }),
    prisma.listingQualityScore.findMany({
      where: { listingId: { in: ids } },
      select: { listingId: true, qualityScore: true, level: true, healthStatus: true },
    }),
  ]);
  const avgByListingId = new Map(
    grouped.map((g) => [g.listingId, g._avg.propertyRating] as const)
  );
  const qualityById = new Map(qualityRows.map((r) => [r.listingId, r]));
  return listings.map((l) => {
    const avg = avgByListingId.get(l.id);
    const rawOwner = l as { owner?: { hostPerformanceMetrics?: { score: number } | null } };
    const hrs = rawOwner.owner?.hostPerformanceMetrics?.score;
    const hostReputationScore =
      hrs != null && Number.isFinite(hrs) ? hrs : null;
    const qRow = qualityById.get(l.id);
    const cachedListingQuality01 =
      qRow != null && Number.isFinite(qRow.qualityScore)
        ? Math.min(1, Math.max(0, qRow.qualityScore / 100))
        : null;
    const qualityBadgeLabel = qRow ? listingQualityBadgeLabelFromRow(qRow) : null;
    return {
      ...l,
      reviews:
        avg != null && Number.isFinite(avg) ? [{ propertyRating: avg as number }] : [],
      hostReputationScore,
      cachedListingQuality01,
      qualityBadgeLabel,
    };
  });
}

export type SearchListingsResult = {
  listings: BnhubListingForRanking[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

async function guestMarketplaceRankContext(
  userId: string | null | undefined,
  checkIn?: string,
  checkOut?: string,
): Promise<ListingSearchRankContext> {
  let guestLoyaltyTier: LoyaltyTier | undefined;
  if (userId) {
    const lp = await prisma.userLoyaltyProfile.findUnique({
      where: { userId },
      select: { tier: true },
    });
    guestLoyaltyTier = lp?.tier;
  }
  return { checkIn, checkOut, guestLoyaltyTier };
}

export async function searchListings(params: ListingSearchParams) {
  const {
    city,
    listingCode: listingCodeParam,
    checkIn,
    checkOut,
    minPrice,
    maxPrice,
    guests = 1,
    verifiedOnly,
    propertyType,
    roomType,
    instantBook,
    minBeds,
    minBaths,
    centerLat,
    centerLng,
    radiusKm,
    sort = "newest",
    amenitySlugs,
    north,
    south,
    east,
    west,
    discoveryFeatures,
    staysFilters,
    geocodeMissingCoordinates = true,
    userId,
    sessionId,
  } = params;

  const where = buildPublishedListingSearchWhere({
    city,
    listingCode: listingCodeParam,
    minPrice,
    maxPrice,
    guests,
    verifiedOnly,
    propertyType,
    roomType,
    instantBook,
    minBeds,
    minBaths,
    centerLat,
    centerLng,
    radiusKm,
    north,
    south,
    east,
    west,
  });

  const orderBy = searchOrderBy(sort, {});

  const listingsRaw = await prisma.shortTermListing.findMany({
    where,
    include: LISTING_SEARCH_BASE_INCLUDE,
    orderBy: orderBy.length > 0 ? orderBy : [{ createdAt: "desc" }],
  });

  let result = await attachReviewAggregatesForSearch(listingsRaw);

  const sortIsAi = sort === "recommended" || sort === "ai";
  const useAiRanking = sortIsAi && isAiRankingEngineEnabled();

  if (sortIsAi && !useAiRanking) {
    const rankCtx = await guestMarketplaceRankContext(userId, checkIn, checkOut);
    const marketingBoost = await getMarketingSearchBoostByListingId();
    const growthBoost = await getGrowthSearchBoostByListingId();
    const ids = result.map((l) => l.id);
    const platformRows = result.map((l) => ({ id: l.id, ownerId: l.ownerId }));
    const [starBoost, tierBoost, riskPen, winnerBoost, platformTrustBoost, repAdjust, qualityAdjust] =
      await Promise.all([
        getClassificationSearchBoostMapForIds(ids),
        getLuxuryTierSearchBoostMapForIds(ids),
        getTrustRiskPenaltyMapForIds(ids),
        getWinnerSearchBoostMapForIds(ids),
        getPlatformTrustSearchBoostMapForListings(platformRows),
        getReputationSearchAdjustMapForListings(platformRows),
        getListingQualitySearchAdjustMapForIds(ids),
      ]);
    result = [...result].sort((a, b) => {
      const baseB = scoreListingForSearch(b, rankCtx).score * 100;
      const baseA = scoreListingForSearch(a, rankCtx).score * 100;
      const sb =
        baseB +
        (marketingBoost.get(b.id) ?? 0) +
        (growthBoost.get(b.id) ?? 0) +
        (starBoost.get(b.id) ?? 0) +
        (tierBoost.get(b.id) ?? 0) +
        (winnerBoost.get(b.id) ?? 0) +
        (platformTrustBoost.get(b.id) ?? 0) +
        (repAdjust.get(b.id) ?? 0) +
        (qualityAdjust.get(b.id) ?? 0) -
        (riskPen.get(b.id) ?? 0);
      const sa =
        baseA +
        (marketingBoost.get(a.id) ?? 0) +
        (growthBoost.get(a.id) ?? 0) +
        (starBoost.get(a.id) ?? 0) +
        (tierBoost.get(a.id) ?? 0) +
        (winnerBoost.get(a.id) ?? 0) +
        (platformTrustBoost.get(a.id) ?? 0) +
        (repAdjust.get(a.id) ?? 0) +
        (qualityAdjust.get(a.id) ?? 0) -
        (riskPen.get(a.id) ?? 0);
      return sb - sa;
    });
  }

  if (!useAiRanking) {
    const featuredIds = await getActivePromotedListingIds({ placement: "FEATURED", limit: 20 });
    if (featuredIds.length > 0) {
      const promoted = result.filter((l) => featuredIds.includes(l.id));
      const rest = result.filter((l) => !featuredIds.includes(l.id));
      const order = [...featuredIds];
      result = [...promoted].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id)).concat(rest);
    }
  }

  if (amenitySlugs?.length) {
    result = result.filter((l) => listingMatchesAmenitySlugs(l.amenities, amenitySlugs));
  }

  if (discoveryFeatures?.length) {
    result = result.filter((l) => discoveryFeatures.every((k) => listingMatchesDiscovery(l, k)));
  }

  if (hasActiveStaysFilters(staysFilters ?? undefined)) {
    result = applyStaysFilters(result, staysFilters!);
  }

  if (geocodeMissingCoordinates) {
    const missing = result.filter((l) => l.latitude == null || l.longitude == null).slice(0, 5);
    if (missing.length > 0) {
      void (async () => {
        for (const l of missing) {
          const line = [l.address, l.city, l.region, l.country].filter(Boolean).join(", ");
          const coords = await geocodeAddressLine(line);
          if (coords) {
            await prisma.shortTermListing
              .update({
                where: { id: l.id },
                data: { latitude: coords.latitude, longitude: coords.longitude },
              })
              .catch(() => {});
          }
          await new Promise((r) => setTimeout(r, 1100));
        }
      })();
    }
  }

  if (checkIn && checkOut) {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const available: typeof result = [];
    for (const listing of result) {
      const isAvailable = await isListingAvailable(listing.id, checkInDate, checkOutDate);
      if (isAvailable) available.push(listing);
    }
    result = available;
  }

  if (useAiRanking && result.length > 0) {
    const ids = result.map((l) => l.id);
    const platformRowsAiFull = result.map((l) => ({ id: l.id, ownerId: l.ownerId }));
    const [
      marketingBoost,
      growthBoost,
      starBoost,
      tierBoost,
      riskPen,
      winnerBoost,
      platformTrustBoost,
      repAdjust,
      qualityAdjust,
    ] = await Promise.all([
      getMarketingSearchBoostByListingId(),
      getGrowthSearchBoostByListingId(),
      getClassificationSearchBoostMapForIds(ids),
      getLuxuryTierSearchBoostMapForIds(ids),
      getTrustRiskPenaltyMapForIds(ids),
      getWinnerSearchBoostMapForIds(ids),
      getPlatformTrustSearchBoostMapForListings(platformRowsAiFull),
      getReputationSearchAdjustMapForListings(platformRowsAiFull),
      getListingQualitySearchAdjustMapForIds(ids),
    ]);
    const boost = (id: string) =>
      (marketingBoost.get(id) ?? 0) +
      (growthBoost.get(id) ?? 0) +
      (starBoost.get(id) ?? 0) +
      (tierBoost.get(id) ?? 0) +
      (winnerBoost.get(id) ?? 0) +
      (platformTrustBoost.get(id) ?? 0) +
      (repAdjust.get(id) ?? 0) +
      (qualityAdjust.get(id) ?? 0) -
      (riskPen.get(id) ?? 0);
    result = await orderBnhubListingsByRankingEngine(result, {
      city,
      guestCount: guests,
      checkIn,
      checkOut,
      budgetMinCents: minPrice != null && minPrice > 0 ? Math.round(minPrice * 100) : undefined,
      budgetMaxCents: maxPrice != null && maxPrice > 0 ? Math.round(maxPrice * 100) : undefined,
      propertyType,
      roomType,
      pageType: "search",
    }, boost);

    const featuredIdsAi = await getActivePromotedListingIds({ placement: "FEATURED", limit: 20 });
    if (featuredIdsAi.length > 0) {
      const promoted = result.filter((l) => featuredIdsAi.includes(l.id));
      const rest = result.filter((l) => !featuredIdsAi.includes(l.id));
      const orderFeat = [...featuredIdsAi];
      result = [...promoted].sort((a, b) => orderFeat.indexOf(a.id) - orderFeat.indexOf(b.id)).concat(rest);
    }
    void maybeLogBnhubSearchImpressions(result, { pageType: "search", city });
  }

  if (sortIsAi && result.length > 0) {
    const enginePrior = useAiRanking
      ? new Map(
          result.map((l, i) => [l.id, result.length <= 1 ? 0 : i / (result.length - 1)] as const)
        )
      : undefined;
    result = (await applyAiSearchRankingToBnhubResults(result, {
      filters: {
        city: city?.trim() || undefined,
        minPrice,
        maxPrice,
        guests,
        propertyType,
        amenitySlugs,
      },
      userId: userId ?? undefined,
      engineOrderPrior: enginePrior,
    })) as typeof result;
  }

  const scored = await attachIntegerAiScoresToBnhubSearchResults(result, { checkIn, checkOut });
  return applyBehaviorLearningToBnhubSearchResults(scored, {
    sort,
    userId,
    sessionId,
    city: city?.trim() || null,
  });
}

const LISTING_SEARCH_BASE_INCLUDE = {
  owner: {
    select: {
      id: true,
      name: true,
      hostQuality: true,
      hostPerformanceMetrics: { select: { score: true } },
    },
  },
  _count: { select: { reviews: true, bookings: true } },
} as const;

/**
 * Paginated search: where + take + skip for fast, scalable results.
 * Use for /api/bnhub/search with limit, page. When sort=recommended, ranks the current page only.
 */
export async function searchListingsPaginated(
  params: ListingSearchParams
): Promise<SearchListingsResult> {
  const {
    city,
    listingCode: listingCodeParam,
    checkIn,
    checkOut,
    minPrice,
    maxPrice,
    guests = 1,
    verifiedOnly,
    propertyType,
    roomType,
    instantBook,
    minBeds,
    minBaths,
    centerLat,
    centerLng,
    radiusKm,
    sort = "newest",
    page = 1,
    limit = 20,
    amenitySlugs,
    userId,
  } = params;

  const where = buildPublishedListingSearchWhere({
    city,
    listingCode: listingCodeParam,
    minPrice,
    maxPrice,
    guests,
    verifiedOnly,
    propertyType,
    roomType,
    instantBook,
    minBeds,
    minBaths,
    centerLat,
    centerLng,
    radiusKm,
  });

  const orderBy = searchOrderBy(sort, { paginated: true });

  const skip = Math.max(0, (page - 1) * limit);

  const [total, listingsRaw] = await Promise.all([
    prisma.shortTermListing.count({ where }),
    prisma.shortTermListing.findMany({
      where,
      include: LISTING_SEARCH_BASE_INCLUDE,
      orderBy,
      take: limit,
      skip,
    }),
  ]);

  let result = await attachReviewAggregatesForSearch(listingsRaw);

  const sortIsAiPage = sort === "recommended" || sort === "ai";
  const useAiRankingPage = sortIsAiPage && isAiRankingEngineEnabled();

  if (sortIsAiPage && !useAiRankingPage) {
    const rankCtx = await guestMarketplaceRankContext(userId, checkIn, checkOut);
    const marketingBoost = await getMarketingSearchBoostByListingId();
    const growthBoost = await getGrowthSearchBoostByListingId();
    const pids = result.map((l) => l.id);
    const platformRowsPage = result.map((l) => ({ id: l.id, ownerId: l.ownerId }));
    const [starBoost, tierBoost, riskPen, winnerBoost, platformTrustBoost, repAdjust, qualityAdjust] =
      await Promise.all([
        getClassificationSearchBoostMapForIds(pids),
        getLuxuryTierSearchBoostMapForIds(pids),
        getTrustRiskPenaltyMapForIds(pids),
        getWinnerSearchBoostMapForIds(pids),
        getPlatformTrustSearchBoostMapForListings(platformRowsPage),
        getReputationSearchAdjustMapForListings(platformRowsPage),
        getListingQualitySearchAdjustMapForIds(pids),
      ]);
    result = [...result].sort((a, b) => {
      const baseB = scoreListingForSearch(b, rankCtx).score * 100;
      const baseA = scoreListingForSearch(a, rankCtx).score * 100;
      const sb =
        baseB +
        (marketingBoost.get(b.id) ?? 0) +
        (growthBoost.get(b.id) ?? 0) +
        (starBoost.get(b.id) ?? 0) +
        (tierBoost.get(b.id) ?? 0) +
        (winnerBoost.get(b.id) ?? 0) +
        (platformTrustBoost.get(b.id) ?? 0) +
        (repAdjust.get(b.id) ?? 0) +
        (qualityAdjust.get(b.id) ?? 0) -
        (riskPen.get(b.id) ?? 0);
      const sa =
        baseA +
        (marketingBoost.get(a.id) ?? 0) +
        (growthBoost.get(a.id) ?? 0) +
        (starBoost.get(a.id) ?? 0) +
        (tierBoost.get(a.id) ?? 0) +
        (winnerBoost.get(a.id) ?? 0) +
        (platformTrustBoost.get(a.id) ?? 0) +
        (repAdjust.get(a.id) ?? 0) +
        (qualityAdjust.get(a.id) ?? 0) -
        (riskPen.get(a.id) ?? 0);
      return sb - sa;
    });
  }

  if (!useAiRankingPage) {
    const featuredIds = await getActivePromotedListingIds({ placement: "FEATURED", limit: 20 });
    if (featuredIds.length > 0) {
      const promoted = result.filter((l) => featuredIds.includes(l.id));
      const rest = result.filter((l) => !featuredIds.includes(l.id));
      const order = [...featuredIds];
      result = [...promoted].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id)).concat(rest);
    }
  }

  if (checkIn && checkOut) {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const flags = await Promise.all(
      result.map((listing) => isListingAvailable(listing.id, checkInDate, checkOutDate))
    );
    result = result.filter((_, i) => flags[i]);
  }

  if (useAiRankingPage && result.length > 0) {
    const pids = result.map((l) => l.id);
    const platformRowsAi = result.map((l) => ({ id: l.id, ownerId: l.ownerId }));
    const [
      marketingBoost,
      growthBoost,
      starBoost,
      tierBoost,
      riskPen,
      winnerBoost,
      platformTrustBoost,
      repAdjust,
      qualityAdjust,
    ] = await Promise.all([
      getMarketingSearchBoostByListingId(),
      getGrowthSearchBoostByListingId(),
      getClassificationSearchBoostMapForIds(pids),
      getLuxuryTierSearchBoostMapForIds(pids),
      getTrustRiskPenaltyMapForIds(pids),
      getWinnerSearchBoostMapForIds(pids),
      getPlatformTrustSearchBoostMapForListings(platformRowsAi),
      getReputationSearchAdjustMapForListings(platformRowsAi),
      getListingQualitySearchAdjustMapForIds(pids),
    ]);
    const boost = (id: string) =>
      (marketingBoost.get(id) ?? 0) +
      (growthBoost.get(id) ?? 0) +
      (starBoost.get(id) ?? 0) +
      (tierBoost.get(id) ?? 0) +
      (winnerBoost.get(id) ?? 0) +
      (platformTrustBoost.get(id) ?? 0) +
      (repAdjust.get(id) ?? 0) +
      (qualityAdjust.get(id) ?? 0) -
      (riskPen.get(id) ?? 0);
    result = await orderBnhubListingsByRankingEngine(result, {
      city,
      guestCount: guests,
      checkIn,
      checkOut,
      budgetMinCents: minPrice != null && minPrice > 0 ? Math.round(minPrice * 100) : undefined,
      budgetMaxCents: maxPrice != null && maxPrice > 0 ? Math.round(maxPrice * 100) : undefined,
      propertyType,
      roomType,
      pageType: "search",
    }, boost);
    const featuredIdsAi = await getActivePromotedListingIds({ placement: "FEATURED", limit: 20 });
    if (featuredIdsAi.length > 0) {
      const promoted = result.filter((l) => featuredIdsAi.includes(l.id));
      const rest = result.filter((l) => !featuredIdsAi.includes(l.id));
      const orderFeat = [...featuredIdsAi];
      result = [...promoted].sort((a, b) => orderFeat.indexOf(a.id) - orderFeat.indexOf(b.id)).concat(rest);
    }
    void maybeLogBnhubSearchImpressions(result, { pageType: "search", city });
  }

  if (sortIsAiPage && result.length > 0) {
    const enginePrior = useAiRankingPage
      ? new Map(
          result.map((l, i) => [l.id, result.length <= 1 ? 0 : i / (result.length - 1)] as const)
        )
      : undefined;
    result = (await applyAiSearchRankingToBnhubResults(result, {
      filters: {
        city: city?.trim() || undefined,
        minPrice,
        maxPrice,
        guests,
        propertyType,
        amenitySlugs,
      },
      userId: userId ?? undefined,
      engineOrderPrior: enginePrior,
    })) as typeof result;
  }

  return {
    listings: result,
    total,
    page,
    limit,
    hasMore: total > skip + result.length,
  };
}

/** Get ordered photo URLs for a listing (BnhubListingPhoto first, then legacy photos). */
export async function getListingPhotoUrls(listingId: string): Promise<string[]> {
  const photos = await prisma.bnhubListingPhoto.findMany({
    where: { listingId },
    orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
  });
  if (photos.length > 0) return photos.map((p) => p.url);
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { photos: true },
  });
  const rawPhotos = listing?.photos;
  return Array.isArray(rawPhotos) ? rawPhotos.filter((photo): photo is string => typeof photo === "string") : [];
}

export async function getListingById(idOrPublicCode: string) {
  try {
    const code = normalizeAnyPublicListingCode(idOrPublicCode);
    const where = code
      ? { listingCode: { equals: code, mode: "insensitive" as const } }
      : { id: idOrPublicCode };
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    return await prisma.shortTermListing.findFirst({
      where,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            phone: true,
            hostQuality: true,
            stripeAccountId: true,
            stripeOnboardingComplete: true,
          },
        },
        listingPhotos: { orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }] },
        bnhubHostListingPromotions: {
          where: {
            active: true,
            startDate: { lte: today },
            endDate: { gte: today },
          },
          orderBy: { discountPercent: "desc" },
          take: 5,
        },
        _count: { select: { reviews: true } },
        reviews: {
          take: 5,
          orderBy: { createdAt: "desc" },
          include: { guest: { select: { name: true } } },
        },
      },
    });
  } catch (error) {
    console.error("Prisma error:", error);
    return null;
  }
}

export async function isListingAvailable(
  listingId: string,
  checkIn: Date,
  checkOut: Date
): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    await expireStaleBnhubPendingBookings(tx, listingId);
    const overlapping = await findOverlappingActiveBnhubBooking(tx, listingId, checkIn, checkOut);
    if (overlapping) return false;
    const start = new Date(checkIn);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(checkOut);
    end.setUTCHours(0, 0, 0, 0);
    const blockedSlot = await tx.availabilitySlot.findFirst({
      where: {
        listingId,
        date: { gte: start, lt: end },
        OR: [{ available: false }, { dayStatus: { in: ["BLOCKED", "BOOKED"] } }],
      },
    });
    return !blockedSlot;
  });
}

export async function getAvailability(listingId: string, start: Date, end: Date) {
  const slots = await prisma.availabilitySlot.findMany({
    where: { listingId, date: { gte: start, lte: end } },
    orderBy: { date: "asc" },
  });
  return slots;
}

export async function setAvailability(
  listingId: string,
  date: Date,
  available: boolean
) {
  const dateOnly = new Date(date);
  dateOnly.setUTCHours(0, 0, 0, 0);
  const dayStatus = available ? BnhubDayAvailabilityStatus.AVAILABLE : BnhubDayAvailabilityStatus.BLOCKED;
  return prisma.availabilitySlot.upsert({
    where: {
      listingId_date: { listingId, date: dateOnly },
    },
    create: { listingId, date: dateOnly, available, dayStatus, bookedByBookingId: null },
    update: { available, dayStatus, bookedByBookingId: null },
  });
}

export type CreateListingData = {
  ownerId: string;
  title: string;
  subtitle?: string;
  description?: string;
  propertyType?: string;
  roomType?: string;
  category?: string;
  address: string;
  city: string;
  region?: string;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
  nightPriceCents: number;
  currency?: string;
  beds: number;
  bedrooms?: number;
  baths: number;
  maxGuests?: number;
  photos: string[];
  amenities?: string[];
  houseRules?: string;
  checkInInstructions?: string;
  checkInTime?: string;
  checkOutTime?: string;
  cancellationPolicy?: string;
  cleaningFeeCents?: number;
  securityDepositCents?: number;
  instantBookEnabled?: boolean;
  minStayNights?: number;
  maxStayNights?: number;
  listingStatus?: ListingStatus;
  safetyFeatures?: string[];
  accessibilityFeatures?: string[];
  parkingDetails?: string;
  neighborhoodDetails?: string;
  listingAuthorityType?: "OWNER" | "BROKER";
  cadastreNumber?: string;
  municipality?: string;
  province?: string;
  brokerLicenseNumber?: string;
  brokerageName?: string;
  conditionOfProperty?: string;
  knownIssues?: string;
  listingRulesStructured?: unknown;
};

export async function createListing(
  data: CreateListingData,
  options?: { skipHostAgreement?: boolean }
) {
  if (!options?.skipHostAgreement) {
    const host = await getApprovedHost(data.ownerId);
    if (host) {
      const accepted = await hasAcceptedHostAgreement(host.id);
      if (!accepted) {
        throw new Error("You must accept the Host Agreement before creating listings. Visit /bnhub/host-agreement");
      }
    }
  }

  const listing = await prisma.$transaction(async (tx) => {
    const listingCode = await allocateUniqueLSTListingCode(tx);
    return tx.shortTermListing.create({
      data: {
      listingCode,
      ownerId: data.ownerId,
      title: data.title,
      subtitle: data.subtitle,
      description: data.description,
      propertyType: data.propertyType,
      roomType: data.roomType,
      category: data.category,
      address: data.address,
      city: data.city,
      region: data.region,
      country: data.country ?? "US",
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      currency: data.currency ?? "USD",
      nightPriceCents: data.nightPriceCents,
      beds: data.beds,
      bedrooms: data.bedrooms,
      baths: data.baths,
      maxGuests: data.maxGuests ?? 4,
      photos: data.photos ?? [],
      amenities: data.amenities ?? [],
      houseRules: data.houseRules,
      checkInInstructions: data.checkInInstructions,
      checkInTime: data.checkInTime,
      checkOutTime: data.checkOutTime,
      cancellationPolicy: data.cancellationPolicy,
      cleaningFeeCents: data.cleaningFeeCents ?? 0,
      securityDepositCents: data.securityDepositCents ?? 0,
      instantBookEnabled: data.instantBookEnabled ?? false,
      minStayNights: data.minStayNights,
      maxStayNights: data.maxStayNights,
      listingStatus: data.listingStatus ?? "DRAFT",
      safetyFeatures: data.safetyFeatures ?? [],
      accessibilityFeatures: data.accessibilityFeatures ?? [],
      parkingDetails: data.parkingDetails,
      neighborhoodDetails: data.neighborhoodDetails,
      listingAuthorityType: data.listingAuthorityType ?? null,
      cadastreNumber: data.cadastreNumber?.trim() || null,
      municipality: data.municipality?.trim() || null,
      province: data.province?.trim() || null,
      brokerLicenseNumber: data.brokerLicenseNumber?.trim() || null,
      brokerageName: data.brokerageName?.trim() || null,
      conditionOfProperty: data.conditionOfProperty?.trim() || null,
      knownIssues: data.knownIssues?.trim() || null,
      listingRulesStructured: data.listingRulesStructured ?? undefined,
      },
    });
  });
  scheduleBnhubListingEngineRefresh(listing.id);
  void import("@/lib/fraud/compute-listing-risk")
    .then((m) => m.evaluateListingFraudAfterCreate(listing.id))
    .catch(() => {});
  const { recordGrowthEventWithFunnel } = await import("@/lib/growth/events");
  void recordGrowthEventWithFunnel("create_listing", {
    userId: data.ownerId,
    metadata: { listingId: listing.id, city: listing.city, listingStatus: listing.listingStatus },
  });
  void recordGrowthEvent({
    eventName: GrowthEventName.LISTING_CREATED,
    userId: data.ownerId,
    idempotencyKey: `listing_created:${listing.id}`,
    metadata: {
      listingId: listing.id,
      city: listing.city,
      listingStatus: listing.listingStatus,
    },
  }).catch(() => {});
  const { enqueueListingContentPipeline } = await import("@/lib/bnhub/content-pipeline/enqueue");
  enqueueListingContentPipeline(listing.id, "create");
  return listing;
}

export type UpdateListingData = Partial<{
  title: string;
  subtitle: string;
  description: string;
  propertyType: string;
  roomType: string;
  category: string;
  address: string;
  city: string;
  region: string;
  country: string;
  nightPriceCents: number;
  currency: string;
  beds: number;
  bedrooms: number;
  baths: number;
  maxGuests: number;
  photos: string[];
  amenities: string[];
  houseRules: string;
  checkInInstructions: string;
  checkInTime: string;
  checkOutTime: string;
  cancellationPolicy: string;
  cleaningFeeCents: number;
  securityDepositCents: number;
  instantBookEnabled: boolean;
  minStayNights: number;
  maxStayNights: number;
  listingStatus: ListingStatus;
  safetyFeatures: string[];
  accessibilityFeatures: string[];
  parkingDetails: string;
  neighborhoodDetails: string;
  listingAuthorityType: "OWNER" | "BROKER";
  cadastreNumber: string;
  municipality: string;
  province: string;
  brokerLicenseNumber: string;
  brokerageName: string;
  conditionOfProperty: string | null;
  knownIssues: string | null;
  noiseLevel: string | null;
  familyFriendly: boolean;
  kidsAllowed: boolean;
  partyAllowed: boolean;
  smokingAllowed: boolean;
  petsAllowed: boolean;
  allowedPetTypes: string[];
  maxPetWeightKg: number | null;
  petRules: string | null;
  experienceTags: string[];
  servicesOffered: string[];
  latitude: number | null;
  longitude: number | null;
  listingRulesStructured: unknown;
}>;

export async function updateListing(id: string, data: UpdateListingData) {
  const payload = { ...data };
  if ("conditionOfProperty" in payload && payload.conditionOfProperty !== undefined)
    payload.conditionOfProperty = payload.conditionOfProperty?.trim() || null;
  if ("knownIssues" in payload && payload.knownIssues !== undefined)
    payload.knownIssues = payload.knownIssues?.trim() || null;
  const shouldRecompute = shouldScheduleFullEngineRecompute(payload as Record<string, unknown>);
  const { listingRulesStructured, ...rest } = payload;
  const updateData = {
    ...rest,
    ...(listingRulesStructured !== undefined && {
      listingRulesStructured: listingRulesStructured as Prisma.InputJsonValue,
    }),
  } as Prisma.ShortTermListingUpdateInput;
  const updated = await prisma.shortTermListing.update({
    where: { id },
    data: updateData,
  });
  if (shouldRecompute) scheduleBnhubListingEngineRefresh(id);
  scheduleFraudRecheck("listing", id);
  enqueueHostAutopilot(updated.ownerId, { type: "listing_updated", listingId: id });
  const { enqueueListingContentPipeline } = await import("@/lib/bnhub/content-pipeline/enqueue");
  enqueueListingContentPipeline(id, "update");
  void import("@/lib/quality/schedule-listing-quality")
    .then((m) => m.scheduleListingQualityRecompute(id))
    .catch(() => {});
  return updated;
}

/** Set or replace listing photos with order and cover. */
export async function setListingPhotos(
  listingId: string,
  photos: { url: string; sortOrder?: number; isCover?: boolean }[]
) {
  await prisma.bnhubListingPhoto.deleteMany({ where: { listingId } });
  if (photos.length === 0) return [];
  const hasExplicitCover = photos.some((p) => p.isCover);
  await prisma.bnhubListingPhoto.createMany({
    data: photos.map((p, i) => ({
      listingId,
      url: p.url,
      sortOrder: p.sortOrder ?? i,
      isCover: p.isCover === true || (!hasExplicitCover && i === 0),
    })),
  });
  const rows = await prisma.bnhubListingPhoto.findMany({
    where: { listingId },
    orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
  });
  scheduleBnhubListingEngineRefresh(listingId);
  scheduleFraudRecheck("listing", listingId);
  const { enqueueListingContentPipeline } = await import("@/lib/bnhub/content-pipeline/enqueue");
  enqueueListingContentPipeline(listingId, "update");
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { ownerId: true, listingStatus: true },
  });
  if (listing) {
    const hourBucket = Math.floor(Date.now() / 3600000);
    void emitPlatformAutonomyEvent({
      eventType: "LISTING_UPDATED",
      entityType: "short_term_listing",
      entityId: listingId,
      userId: listing.ownerId,
      payload: { listingId, listingStatus: listing.listingStatus, source: "bnhub_photos" },
      dedupeKey: `lu:${listingId}:photos:${hourBucket}`,
    });
  }
  return rows;
}

export async function getListingsByOwner(ownerId: string) {
  return prisma.shortTermListing.findMany({
    where: { ownerId },
    include: {
      _count: { select: { bookings: true, reviews: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
