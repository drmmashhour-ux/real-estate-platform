import { prisma } from "@/lib/db";
import { ListingAnalyticsKind, ListingStatus, VerificationStatus } from "@prisma/client";
import {
  RANKING_LISTING_TYPE_BNHUB,
  RANKING_LISTING_TYPE_REAL_ESTATE,
  type RankingListingType,
} from "@/src/modules/ranking/dataMap";
import {
  computeBnhubRankingScore,
  computeRealEstateRankingScore,
  loadActiveRankingConfig,
  loadRankingWeightsForContext,
} from "@/src/modules/ranking/scoringEngine";
import type { RankingScoreResult, RankingSearchContext, BnhubListingRankingInput, FsboListingRankingInput } from "./types";
import { logRankingImpressions } from "@/src/modules/ranking/tracking";
import {
  getBnhubFraudPenaltyMap,
  getBnhubListingFraudRankingAdjustment,
} from "@/src/modules/fraud/fraudRankingIntegration";
import { augmentRankingSearchContextWithCityProfile } from "@/src/modules/cities/cityRankingBridge";

function photoCountFromListing(photos: unknown): number {
  if (!Array.isArray(photos)) return 0;
  return photos.filter((x): x is string => typeof x === "string").length;
}

function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}

export async function buildBnhubRankingInputs(
  listings: Array<{
    id: string;
    city: string;
    region: string | null;
    nightPriceCents: number;
    maxGuests: number;
    propertyType: string | null;
    roomType: string | null;
    amenities: unknown;
    photos: unknown;
    description: string | null;
    verificationStatus: string;
    listingVerificationStatus: string;
    listingStatus: string;
    ownerId: string;
    createdAt: Date;
    updatedAt: Date;
    instantBookEnabled: boolean;
    houseRules: string | null;
    checkInInstructions: string | null;
    reputationRankBoost?: number;
    reviews: { propertyRating: number }[];
    _count: { reviews: number; bookings: number };
  }>
): Promise<BnhubListingRankingInput[]> {
  if (listings.length === 0) return [];
  const ids = listings.map((l) => l.id);
  const ownerIds = [...new Set(listings.map((l) => l.ownerId))];

  const [aggRows, hostRows, badgeRows, disputeRows, favRows, completedRows] = await Promise.all([
    prisma.propertyRatingAggregate.findMany({
      where: { listingId: { in: ids } },
      select: { listingId: true, avgRating: true, totalReviews: true },
    }),
    prisma.hostPerformance.findMany({
      where: { hostId: { in: ownerIds } },
      select: { hostId: true, score: true },
    }),
    prisma.hostBadge.findMany({
      where: { hostId: { in: ownerIds }, badgeType: { in: ["fast_responder", "reliable_host"] } },
      select: { hostId: true, badgeType: true },
    }),
    prisma.dispute.groupBy({
      by: ["listingId"],
      where: { listingId: { in: ids } },
      _count: { _all: true },
    }),
    prisma.bnhubGuestFavorite.groupBy({
      by: ["listingId"],
      where: { listingId: { in: ids } },
      _count: { _all: true },
    }),
    prisma.booking.groupBy({
      by: ["listingId"],
      where: { listingId: { in: ids }, status: "COMPLETED" },
      _count: { _all: true },
    }),
  ]);

  const aggMap = new Map(aggRows.map((r) => [r.listingId, r]));
  const hostMap = new Map(hostRows.map((r) => [r.hostId, r.score]));
  const fast = new Set(badgeRows.filter((b) => b.badgeType === "fast_responder").map((b) => b.hostId));
  const reliable = new Set(badgeRows.filter((b) => b.badgeType === "reliable_host").map((b) => b.hostId));
  const disputeMap = new Map(disputeRows.map((d) => [d.listingId, d._count._all]));
  const favMap = new Map(favRows.map((f) => [f.listingId, f._count._all]));
  const completedMap = new Map(completedRows.map((c) => [c.listingId, c._count._all]));

  const med = median(listings.map((l) => l.nightPriceCents));

  return listings.map((l) => {
    const agg = aggMap.get(l.id);
    const rv = l.reviews[0]?.propertyRating;
    return {
      id: l.id,
      city: l.city,
      region: l.region,
      nightPriceCents: l.nightPriceCents,
      maxGuests: l.maxGuests,
      propertyType: l.propertyType,
      roomType: l.roomType,
      amenities: l.amenities,
      photos: l.photos,
      description: l.description,
      verificationStatus: l.verificationStatus,
      listingVerificationStatus: l.listingVerificationStatus,
      listingStatus: l.listingStatus,
      ownerId: l.ownerId,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
      instantBookEnabled: l.instantBookEnabled,
      houseRules: l.houseRules,
      checkInInstructions: l.checkInInstructions,
      photoCount: photoCountFromListing(l.photos),
      reviewAvg: rv ?? null,
      reviewCount: l._count.reviews,
      completedBookings: completedMap.get(l.id) ?? 0,
      disputeCount: disputeMap.get(l.id) ?? 0,
      favoriteCount: favMap.get(l.id) ?? 0,
      aggregateAvgRating: agg?.avgRating ?? null,
      aggregateTotalReviews: agg?.totalReviews ?? 0,
      hostPerformanceScore: hostMap.get(l.ownerId) ?? null,
      hostHasFastResponder: fast.has(l.ownerId),
      hostHasReliable: reliable.has(l.ownerId),
      medianNightPriceCents: med,
      reputationRankBoost: l.reputationRankBoost ?? 0,
    };
  });
}

export async function persistRankingScore(result: RankingScoreResult): Promise<void> {
  const fraudAdj =
    result.listingType === RANKING_LISTING_TYPE_BNHUB
      ? await getBnhubListingFraudRankingAdjustment(result.listingId)
      : { totalPenalty: 0, metadataPatch: {} as Record<string, unknown> };
  const totalScore =
    result.listingType === RANKING_LISTING_TYPE_BNHUB
      ? Math.max(0, result.totalScore - fraudAdj.totalPenalty)
      : result.totalScore;
  const baseMeta = result.explanation
    ? {
        explanation: result.explanation,
        weightsUsed: result.weightsUsed,
      }
    : { weightsUsed: result.weightsUsed };
  const metadataJson = { ...baseMeta, ...fraudAdj.metadataPatch };

  await prisma.listingRankingScore.upsert({
    where: {
      listingType_listingId: { listingType: result.listingType, listingId: result.listingId },
    },
    create: {
      listingType: result.listingType,
      listingId: result.listingId,
      city: result.city,
      neighborhood: result.neighborhood,
      totalScore,
      relevanceScore: result.relevanceScore,
      trustScore: result.trustScore,
      qualityScore: result.qualityScore,
      engagementScore: result.engagementScore,
      conversionScore: result.conversionScore,
      freshnessScore: result.freshnessScore,
      hostScore: result.hostScore,
      reviewScore: result.reviewScore,
      priceCompetitivenessScore: result.priceCompetitivenessScore,
      availabilityScore: result.availabilityScore,
      metadataJson,
    },
    update: {
      city: result.city,
      neighborhood: result.neighborhood,
      totalScore,
      relevanceScore: result.relevanceScore,
      trustScore: result.trustScore,
      qualityScore: result.qualityScore,
      engagementScore: result.engagementScore,
      conversionScore: result.conversionScore,
      freshnessScore: result.freshnessScore,
      hostScore: result.hostScore,
      reviewScore: result.reviewScore,
      priceCompetitivenessScore: result.priceCompetitivenessScore,
      availabilityScore: result.availabilityScore,
      metadataJson,
    },
  });
}

export async function recomputeRankingForListing(
  listingType: RankingListingType,
  listingId: string,
  ctx: Partial<RankingSearchContext> = {}
): Promise<RankingScoreResult | null> {
  const baseCtx: RankingSearchContext = {
    listingType,
    ...ctx,
  };

  if (listingType === RANKING_LISTING_TYPE_BNHUB) {
    const row = await prisma.shortTermListing.findUnique({
      where: { id: listingId },
      include: {
        owner: { select: { id: true } },
        reviews: { select: { propertyRating: true }, take: 1 },
        _count: { select: { reviews: true, bookings: true } },
      },
    });
    if (!row) return null;
    const [inputs] = await buildBnhubRankingInputs([
      {
        ...row,
        reviews: row.reviews.length ? row.reviews : ([] as { propertyRating: number }[]),
      },
    ]);
    const res = await computeBnhubRankingScore(inputs, { ...baseCtx, availableForDates: true });
    await persistRankingScore(res);
    return res;
  }

  if (listingType === RANKING_LISTING_TYPE_REAL_ESTATE) {
    const row = await prisma.fsboListing.findUnique({
      where: { id: listingId },
      include: {
        verification: true,
        _count: { select: { buyerListingViews: true, buyerSavedListings: true, leads: true } },
      },
    });
    if (!row) return null;
    const ver = row.verification;
    const allVerified =
      ver &&
      ver.identityStatus === VerificationStatus.VERIFIED &&
      ver.addressStatus === VerificationStatus.VERIFIED &&
      ver.cadasterStatus === VerificationStatus.VERIFIED;
    const input: FsboListingRankingInput = {
      id: row.id,
      city: row.city,
      priceCents: row.priceCents,
      bedrooms: row.bedrooms,
      bathrooms: row.bathrooms,
      images: Array.isArray(row.images) ? row.images : [],
      description: row.description,
      propertyType: row.propertyType,
      status: row.status,
      moderationStatus: row.moderationStatus,
      trustScore: row.trustScore,
      riskScore: row.riskScore,
      verificationStatus: allVerified ? "VERIFIED" : ver ? "PENDING" : null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      featuredUntil: row.featuredUntil,
      viewCount: row._count.buyerListingViews,
      saveCount: row._count.buyerSavedListings,
      leadCount: row._count.leads,
      medianPriceCents: null,
    };
    const res = await computeRealEstateRankingScore(input, baseCtx);
    await persistRankingScore(res);
    return res;
  }

  return null;
}

export async function recomputeRankingForCity(
  listingType: RankingListingType,
  city: string,
  limit = 200
): Promise<number> {
  let n = 0;
  if (listingType === RANKING_LISTING_TYPE_BNHUB) {
    const rows = await prisma.shortTermListing.findMany({
      where: {
        listingStatus: ListingStatus.PUBLISHED,
        ...(city.trim()
          ? { city: { contains: city, mode: "insensitive" as const } }
          : {}),
      },
      take: limit,
      include: {
        owner: { select: { id: true } },
        reviews: { select: { propertyRating: true }, take: 1 },
        _count: { select: { reviews: true, bookings: true } },
      },
    });
    const inputs = await buildBnhubRankingInputs(
      rows.map((r) => ({ ...r, reviews: r.reviews.length ? r.reviews : [] }))
    );
    const ctx: RankingSearchContext = { listingType, city: city.trim() || undefined };
    for (const input of inputs) {
      const res = await computeBnhubRankingScore(input, {
        ...ctx,
        availableForDates: true,
      });
      await persistRankingScore(res);
      n++;
    }
    return n;
  }
  if (listingType === RANKING_LISTING_TYPE_REAL_ESTATE) {
    const rows = await prisma.fsboListing.findMany({
      where: {
        status: "ACTIVE",
        moderationStatus: "APPROVED",
        ...(city.trim()
          ? { city: { contains: city, mode: "insensitive" as const } }
          : {}),
      },
      take: limit,
      include: {
        verification: true,
        _count: { select: { buyerListingViews: true, buyerSavedListings: true, leads: true } },
      },
    });
    const med = median(rows.map((r) => r.priceCents));
    for (const row of rows) {
      const ver = row.verification;
      const allVerified =
        ver &&
        ver.identityStatus === VerificationStatus.VERIFIED &&
        ver.addressStatus === VerificationStatus.VERIFIED &&
        ver.cadasterStatus === VerificationStatus.VERIFIED;
      const input: FsboListingRankingInput = {
        id: row.id,
        city: row.city,
        priceCents: row.priceCents,
        bedrooms: row.bedrooms,
        bathrooms: row.bathrooms,
        images: Array.isArray(row.images) ? row.images : [],
        description: row.description,
        propertyType: row.propertyType,
        status: row.status,
        moderationStatus: row.moderationStatus,
        trustScore: row.trustScore,
        riskScore: row.riskScore,
        verificationStatus: allVerified ? "VERIFIED" : ver ? "PENDING" : null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        featuredUntil: row.featuredUntil,
        viewCount: row._count.buyerListingViews,
        saveCount: row._count.buyerSavedListings,
        leadCount: row._count.leads,
        medianPriceCents: med,
      };
      const res = await computeRealEstateRankingScore(input, { listingType, city });
      await persistRankingScore(res);
      n++;
    }
    return n;
  }
  return 0;
}

export async function recomputeAllRankingScores(listingType?: RankingListingType): Promise<{ bnhub: number; realEstate: number }> {
  const out = { bnhub: 0, realEstate: 0 };
  const types: RankingListingType[] = listingType
    ? [listingType]
    : [RANKING_LISTING_TYPE_BNHUB, RANKING_LISTING_TYPE_REAL_ESTATE];
  for (const t of types) {
    if (t === RANKING_LISTING_TYPE_BNHUB) {
      const rows = await prisma.shortTermListing.findMany({
        where: { listingStatus: ListingStatus.PUBLISHED },
        take: 500,
        orderBy: { updatedAt: "desc" },
        include: {
          owner: { select: { id: true } },
          reviews: { select: { propertyRating: true }, take: 1 },
          _count: { select: { reviews: true, bookings: true } },
        },
      });
      const inputs = await buildBnhubRankingInputs(
        rows.map((r) => ({ ...r, reviews: r.reviews.length ? r.reviews : [] }))
      );
      for (const input of inputs) {
        const res = await computeBnhubRankingScore(input, { listingType: t, city: input.city });
        await persistRankingScore(res);
        out.bnhub++;
      }
    } else if (t === RANKING_LISTING_TYPE_REAL_ESTATE) {
      out.realEstate += await recomputeRankingForCity(t, "", 500);
    }
  }
  return out;
}

export async function getRankedListings(opts: {
  listingType: RankingListingType;
  city?: string;
  take?: number;
}): Promise<RankingScoreResult[]> {
  const take = Math.min(200, Math.max(1, opts.take ?? 50));
  const rows = await prisma.listingRankingScore.findMany({
    where: {
      listingType: opts.listingType,
      ...(opts.city ? { city: { contains: opts.city, mode: "insensitive" } } : {}),
    },
    orderBy: { totalScore: "desc" },
    take,
  });
  return rows.map((r) => ({
    listingType: r.listingType as RankingListingType,
    listingId: r.listingId,
    city: r.city,
    neighborhood: r.neighborhood,
    totalScore: r.totalScore,
    relevanceScore: r.relevanceScore,
    trustScore: r.trustScore,
    qualityScore: r.qualityScore,
    engagementScore: r.engagementScore,
    conversionScore: r.conversionScore,
    freshnessScore: r.freshnessScore,
    hostScore: r.hostScore,
    reviewScore: r.reviewScore,
    priceCompetitivenessScore: r.priceCompetitivenessScore,
    availabilityScore: r.availabilityScore,
    signals: {
      relevance: r.relevanceScore,
      trust: r.trustScore,
      quality: r.qualityScore,
      engagement: r.engagementScore,
      conversion: r.conversionScore,
      freshness: r.freshnessScore,
      host: r.hostScore ?? 0,
      review: r.reviewScore ?? 0,
      priceCompetitiveness: r.priceCompetitivenessScore ?? 0,
      availability: r.availabilityScore ?? 0,
    },
    weightsUsed: {},
    explanation: (r.metadataJson as { explanation?: RankingScoreResult["explanation"] } | null)?.explanation,
  }));
}

type BnhubSearchRow = {
  id: string;
  city: string;
  region: string | null;
  nightPriceCents: number;
  maxGuests: number;
  propertyType: string | null;
  roomType: string | null;
  amenities: unknown;
  photos: unknown;
  description: string | null;
  verificationStatus: string;
  listingVerificationStatus: string;
  listingStatus: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  instantBookEnabled: boolean;
  houseRules: string | null;
  checkInInstructions: string | null;
  reputationRankBoost?: number;
  reviews: { propertyRating: number }[];
  _count: { reviews: number; bookings: number };
};

/**
 * Final-pass BNHub search ordering: explainable engine score (0–100) + real boost maps (marketing/growth/etc.).
 */
export async function orderBnhubListingsByRankingEngine<T extends BnhubSearchRow>(
  listings: T[],
  ctx: Omit<RankingSearchContext, "listingType"> & { listingType?: RankingListingType },
  extraBoost?: (listingId: string) => number
): Promise<T[]> {
  if (listings.length <= 1) return listings;
  const inputs = await buildBnhubRankingInputs(listings);
  const fullCtx: RankingSearchContext = {
    listingType: RANKING_LISTING_TYPE_BNHUB,
    availableForDates: true,
    ...ctx,
  };
  const cityAugmented = await augmentRankingSearchContextWithCityProfile(fullCtx);
  const weights = await loadRankingWeightsForContext(RANKING_LISTING_TYPE_BNHUB, cityAugmented);
  const boost = extraBoost ?? (() => 0);
  const fraudPenalties = await getBnhubFraudPenaltyMap(listings.map((l) => l.id));
  const scored: { listing: T; total: number }[] = [];
  for (let i = 0; i < listings.length; i++) {
    const res = await computeBnhubRankingScore(inputs[i]!, cityAugmented, weights);
    const x = boost(listings[i]!.id);
    const fp = fraudPenalties.get(listings[i]!.id) ?? 0;
    scored.push({ listing: listings[i]!, total: res.totalScore + x - fp });
  }
  scored.sort((a, b) => b.total - a.total);
  return scored.map((s) => s.listing);
}

export async function maybeLogBnhubSearchImpressions(
  listings: { id: string }[],
  ctx: Pick<RankingSearchContext, "pageType" | "city" | "userId" | "sessionId">
): Promise<void> {
  await logRankingImpressions(
    RANKING_LISTING_TYPE_BNHUB,
    listings.map((l, i) => ({ listingId: l.id, position: i })),
    ctx
  );
}

/** FSBO scores for buyer browse (recommended + AI engine). */
export async function scoreRealEstateListingsForBrowse(
  ids: string[],
  ctx: Pick<
    RankingSearchContext,
    "city" | "propertyType" | "budgetMinCents" | "budgetMaxCents"
  >
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (ids.length === 0) return map;
  const rows = await prisma.fsboListing.findMany({
    where: { id: { in: ids } },
    include: {
      verification: true,
      _count: { select: { buyerListingViews: true, buyerSavedListings: true, leads: true } },
    },
  });
  const demandRows = await prisma.listingAnalytics.findMany({
    where: { kind: ListingAnalyticsKind.FSBO, listingId: { in: ids } },
    select: { listingId: true, demandScore: true },
  });
  const demandMap = new Map(demandRows.map((r) => [r.listingId, r.demandScore]));
  const med = median(rows.map((r) => r.priceCents));
  const fullCtx: RankingSearchContext = {
    listingType: RANKING_LISTING_TYPE_REAL_ESTATE,
    city: ctx.city,
    propertyType: ctx.propertyType,
    budgetMinCents: ctx.budgetMinCents,
    budgetMaxCents: ctx.budgetMaxCents,
  };
  const weights = await loadActiveRankingConfig(RANKING_LISTING_TYPE_REAL_ESTATE);
  for (const row of rows) {
    const ver = row.verification;
    const allVerified =
      ver &&
      ver.identityStatus === VerificationStatus.VERIFIED &&
      ver.addressStatus === VerificationStatus.VERIFIED &&
      ver.cadasterStatus === VerificationStatus.VERIFIED;
    const input: FsboListingRankingInput = {
      id: row.id,
      city: row.city,
      priceCents: row.priceCents,
      bedrooms: row.bedrooms,
      bathrooms: row.bathrooms,
      images: Array.isArray(row.images) ? row.images : [],
      description: row.description,
      propertyType: row.propertyType,
      status: row.status,
      moderationStatus: row.moderationStatus,
      trustScore: row.trustScore,
      riskScore: row.riskScore,
      verificationStatus: allVerified ? "VERIFIED" : ver ? "PENDING" : null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      featuredUntil: row.featuredUntil,
      viewCount: row._count.buyerListingViews,
      saveCount: row._count.buyerSavedListings,
      leadCount: row._count.leads,
      demandScoreFromAnalytics: demandMap.get(row.id) ?? 0,
      medianPriceCents: med,
    };
    const res = await computeRealEstateRankingScore(input, fullCtx, weights);
    map.set(row.id, res.totalScore);
  }
  return map;
}
