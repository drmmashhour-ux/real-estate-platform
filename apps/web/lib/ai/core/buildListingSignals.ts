import { ListingAnalyticsKind, ListingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { calculateDemandScore } from "@/lib/ai/pricing/calculateDemandScore";
import type { ListingSignals, ListingQualityFlags } from "./types";

function monthSeasonality(d = new Date()): number {
  const m = d.getMonth();
  if (m >= 5 && m <= 8) return 1.12;
  if (m === 11 || m === 0) return 1.08;
  return 0.95;
}

function weekendBoost(d = new Date()): number {
  const day = d.getUTCDay();
  const daysToSat = (6 - day + 7) % 7;
  return daysToSat <= 2 ? 0.15 : 0.05;
}

function qualityFromListing(l: {
  title: string;
  description: string | null;
  amenities: unknown;
  listingPhotos: { id: string }[];
  photos: unknown;
}): ListingQualityFlags {
  const photoCount = l.listingPhotos?.length
    ? l.listingPhotos.length
    : Array.isArray(l.photos)
      ? (l.photos as unknown[]).filter((x) => typeof x === "string").length
      : 0;
  const descLen = l.description?.trim().length ?? 0;
  const titleLen = l.title.trim().length;
  const amenCount = Array.isArray(l.amenities) ? l.amenities.length : 0;
  return {
    lowPhotoCount: photoCount < 5,
    weakDescription: descLen < 120,
    weakTitle: titleLen < 24,
    missingAmenities: amenCount < 5,
  };
}

/**
 * Load normalized BNHub listing signals — shared input for search, pricing, autopilot, recommendations.
 */
export async function buildListingSignals(listingId: string): Promise<ListingSignals | null> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    include: {
      bnhubHostListingPromotions: { where: { active: true } },
      listingPhotos: { select: { id: true } },
      propertyRatingAggregate: { select: { avgRating: true, totalReviews: true } },
    },
  });
  if (!listing || listing.listingStatus !== ListingStatus.PUBLISHED) return null;

  const [analytics, metrics, avgRow, bookings30, bookings7, occRows, competitionCount] = await Promise.all([
    prisma.listingAnalytics.findFirst({
      where: { listingId, kind: ListingAnalyticsKind.BNHUB },
    }),
    prisma.listingSearchMetrics.findUnique({ where: { listingId } }),
    prisma.shortTermListing.aggregate({
      where: {
        listingStatus: ListingStatus.PUBLISHED,
        city: { equals: listing.city, mode: "insensitive" },
      },
      _avg: { nightPriceCents: true },
    }),
    prisma.booking.count({
      where: {
        listingId,
        createdAt: { gte: new Date(Date.now() - 30 * 86400000) },
        status: { in: ["CONFIRMED", "COMPLETED", "PENDING"] },
      },
    }),
    prisma.booking.count({
      where: {
        listingId,
        createdAt: { gte: new Date(Date.now() - 7 * 86400000) },
        status: { in: ["CONFIRMED", "COMPLETED", "PENDING"] },
      },
    }),
    prisma.booking.findMany({
      where: {
        listingId,
        status: { in: ["CONFIRMED", "COMPLETED"] },
        checkOut: { gte: new Date() },
      },
      select: { nights: true },
    }),
    prisma.shortTermListing.count({
      where: {
        city: { equals: listing.city, mode: "insensitive" },
        listingStatus: ListingStatus.PUBLISHED,
        id: { not: listingId },
      },
    }),
  ]);

  const views30 = metrics?.views30d ?? analytics?.viewsTotal ?? 0;
  const views7 = metrics?.views7d ?? Math.max(analytics?.views24hCached ?? 0, Math.round(views30 * 0.2));
  const bookingVelocity = Math.min(5, bookings30 / 10);
  const occNights = occRows.reduce((s, r) => s + r.nights, 0);
  const occupancyRate = Math.min(1, occNights / 30);

  const demand = calculateDemandScore({
    views7d: views7,
    views30d: views30,
    bookingVelocity,
    occupancyRate,
    seasonalityMultiplier: monthSeasonality(),
    hasActivePromotion: listing.bnhubHostListingPromotions.length > 0,
    upcomingWeekendBoost: weekendBoost(),
    competitionCount,
  });

  const ctr = metrics?.ctr ?? 0.1;
  const conv =
    metrics?.conversionRate != null && Number.isFinite(metrics.conversionRate)
      ? metrics.conversionRate
      : views7 > 0
        ? Math.min(1, bookings7 / Math.max(views7, 1))
        : 0;

  const avgCents = avgRow._avg.nightPriceCents;
  const qualityFlags = qualityFromListing(listing);

  return {
    listingId: listing.id,
    city: listing.city,
    region: listing.region,
    propertyType: listing.propertyType,
    roomType: listing.roomType,
    currentPrice: listing.nightPriceCents / 100,
    nightPriceCents: listing.nightPriceCents,
    maxGuests: listing.maxGuests,
    avgAreaNightPrice: avgCents != null ? avgCents / 100 : null,
    demandScore: demand.demandScore,
    demandScoreRaw: demand.demandScore,
    conversionRate: conv,
    ctr,
    occupancyRate,
    bookingVelocity,
    views7d: views7,
    views30d: views30,
    bookings7d: bookings7,
    bookings30d: bookings30,
    photoCount: listing.listingPhotos.length
      ? listing.listingPhotos.length
      : Array.isArray(listing.photos)
        ? (listing.photos as string[]).filter((x) => typeof x === "string").length
        : 0,
    reviewAvg: listing.propertyRatingAggregate?.avgRating ?? listing.bnhubListingRatingAverage ?? null,
    reviewCount: listing.propertyRatingAggregate?.totalReviews ?? listing.bnhubListingReviewCount ?? 0,
    hasActivePromotion: listing.bnhubHostListingPromotions.length > 0,
    competitionCount,
    createdAt: listing.createdAt,
    qualityFlags,
  };
}

/**
 * Batch-load signals for many listings (search ranking). Skips invalid/unpublished ids.
 */
export async function buildListingSignalsBatch(listingIds: string[]): Promise<Map<string, ListingSignals>> {
  const out = new Map<string, ListingSignals>();
  if (listingIds.length === 0) return out;

  const unique = [...new Set(listingIds)];
  const listings = await prisma.shortTermListing.findMany({
    where: { id: { in: unique }, listingStatus: ListingStatus.PUBLISHED },
    include: {
      bnhubHostListingPromotions: { where: { active: true } },
      listingPhotos: { select: { id: true } },
      propertyRatingAggregate: { select: { avgRating: true, totalReviews: true } },
    },
  });

  const metricsRows = await prisma.listingSearchMetrics.findMany({
    where: { listingId: { in: listings.map((l) => l.id) } },
  });
  const metricsMap = new Map(metricsRows.map((m) => [m.listingId, m]));

  const analyticsRows = await prisma.listingAnalytics.findMany({
    where: { kind: ListingAnalyticsKind.BNHUB, listingId: { in: listings.map((l) => l.id) } },
  });
  const analyticsMap = new Map(analyticsRows.map((a) => [a.listingId, a]));

  const cities = [...new Set(listings.map((l) => l.city))];
  const avgs = await prisma.shortTermListing.groupBy({
    by: ["city"],
    where: { listingStatus: ListingStatus.PUBLISHED, city: { in: cities } },
    _avg: { nightPriceCents: true },
  });
  const avgByCity = new Map(avgs.map((a) => [a.city.toLowerCase(), a._avg.nightPriceCents]));

  const cityCompetition = await prisma.shortTermListing.groupBy({
    by: ["city"],
    where: { listingStatus: ListingStatus.PUBLISHED, city: { in: cities } },
    _count: { _all: true },
  });
  const compByCity = new Map(cityCompetition.map((c) => [c.city.toLowerCase(), Math.max(0, c._count._all - 1)]));

  const booking30 = await prisma.booking.groupBy({
    by: ["listingId"],
    where: {
      listingId: { in: listings.map((l) => l.id) },
      createdAt: { gte: new Date(Date.now() - 30 * 86400000) },
      status: { in: ["CONFIRMED", "COMPLETED", "PENDING"] },
    },
    _count: { _all: true },
  });
  const b30 = new Map(booking30.map((x) => [x.listingId, x._count._all]));

  const booking7 = await prisma.booking.groupBy({
    by: ["listingId"],
    where: {
      listingId: { in: listings.map((l) => l.id) },
      createdAt: { gte: new Date(Date.now() - 7 * 86400000) },
      status: { in: ["CONFIRMED", "COMPLETED", "PENDING"] },
    },
    _count: { _all: true },
  });
  const b7 = new Map(booking7.map((x) => [x.listingId, x._count._all]));

  for (const listing of listings) {
    const views30 = metricsMap.get(listing.id)?.views30d ?? analyticsMap.get(listing.id)?.viewsTotal ?? 0;
    const views7 =
      metricsMap.get(listing.id)?.views7d ??
      Math.max(analyticsMap.get(listing.id)?.views24hCached ?? 0, Math.round(views30 * 0.2));
    const bookings30 = b30.get(listing.id) ?? 0;
    const bookings7 = b7.get(listing.id) ?? 0;
    const bookingVelocity = Math.min(5, bookings30 / 10);

    const competitionCount = compByCity.get(listing.city.toLowerCase()) ?? 0;

    /** Batch path: approximate occupancy from booking velocity (full precision in `buildListingSignals`). */
    const occupancyRate = Math.min(1, bookingVelocity / 3 + bookings30 / 40);

    const demand = calculateDemandScore({
      views7d: views7,
      views30d: views30,
      bookingVelocity,
      occupancyRate,
      seasonalityMultiplier: monthSeasonality(),
      hasActivePromotion: listing.bnhubHostListingPromotions.length > 0,
      upcomingWeekendBoost: weekendBoost(),
      competitionCount,
    });

    const m = metricsMap.get(listing.id);
    const ctr = m?.ctr ?? 0.1;
    const conv =
      m?.conversionRate != null && Number.isFinite(m.conversionRate)
        ? m.conversionRate
        : views7 > 0
          ? Math.min(1, bookings7 / Math.max(views7, 1))
          : 0;

    const avgCents = avgByCity.get(listing.city.toLowerCase());
    const qualityFlags = qualityFromListing(listing);

    out.set(listing.id, {
      listingId: listing.id,
      city: listing.city,
      region: listing.region,
      propertyType: listing.propertyType,
      roomType: listing.roomType,
      currentPrice: listing.nightPriceCents / 100,
      nightPriceCents: listing.nightPriceCents,
      maxGuests: listing.maxGuests,
      avgAreaNightPrice: avgCents != null ? avgCents / 100 : null,
      demandScore: demand.demandScore,
      demandScoreRaw: demand.demandScore,
      conversionRate: conv,
      ctr,
      occupancyRate,
      bookingVelocity,
      views7d: views7,
      views30d: views30,
      bookings7d: bookings7,
      bookings30d: bookings30,
      photoCount: listing.listingPhotos.length
        ? listing.listingPhotos.length
        : Array.isArray(listing.photos)
          ? (listing.photos as string[]).filter((x) => typeof x === "string").length
          : 0,
      reviewAvg: listing.propertyRatingAggregate?.avgRating ?? listing.bnhubListingRatingAverage ?? null,
      reviewCount: listing.propertyRatingAggregate?.totalReviews ?? listing.bnhubListingReviewCount ?? 0,
      hasActivePromotion: listing.bnhubHostListingPromotions.length > 0,
      competitionCount,
      createdAt: listing.createdAt,
      qualityFlags,
    });
  }

  return out;
}
