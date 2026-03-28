import { prisma } from "@/lib/db";
import { ListingStatus, VerificationStatus } from "@prisma/client";
import { expandCityKeyToDbNames, normalizeCityKey } from "@/src/modules/cities/cityNormalizer";
import { fsboCityWhere, shortTermCityWhere } from "@/src/modules/cities/cityPrismaHelpers";
import { getCityOperationProfile } from "@/src/modules/cities/cityConfigService";

export type CityKpiMetrics = Record<string, number | string | boolean | null | object>;

function utcDayStart(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

async function gatherCityMetrics(
  cityKey: string,
  profileCityName: string | null | undefined,
  start: Date,
  end: Date
): Promise<CityKpiMetrics> {
  const stWhere = shortTermCityWhere(cityKey, profileCityName);
  const fsboWhere = fsboCityWhere(cityKey, profileCityName);

  const activeBnhub = await prisma.shortTermListing.count({
    where: { ...stWhere, listingStatus: ListingStatus.PUBLISHED },
  });
  const activeRe = await prisma.fsboListing.count({
    where: { ...fsboWhere, status: "ACTIVE", moderationStatus: "APPROVED" },
  });
  const verifiedBnhub = await prisma.shortTermListing.count({
    where: {
      ...stWhere,
      listingStatus: ListingStatus.PUBLISHED,
      verificationStatus: VerificationStatus.VERIFIED,
    },
  });

  let verifiedFsbo = 0;
  try {
    verifiedFsbo = await prisma.fsboListing.count({
      where: {
        ...fsboWhere,
        status: "ACTIVE",
        moderationStatus: "APPROVED",
        verification: {
          identityStatus: VerificationStatus.VERIFIED,
          addressStatus: VerificationStatus.VERIFIED,
          cadasterStatus: VerificationStatus.VERIFIED,
        },
      },
    });
  } catch {
    verifiedFsbo = 0;
  }

  const verifiedHostCount = await prisma.user.count({
    where: {
      shortTermListings: {
        some: { ...stWhere, listingStatus: ListingStatus.PUBLISHED },
      },
    },
  });

  let verifiedBrokerCount = 0;
  try {
    verifiedBrokerCount = await prisma.user.count({
      where: {
        role: "BROKER",
        fsboListings: { some: { ...fsboWhere, status: "ACTIVE" } },
      },
    });
  } catch {
    verifiedBrokerCount = 0;
  }

  const bookingVolume = await prisma.booking.count({
    where: {
      listing: stWhere,
      createdAt: { gte: start, lte: end },
    },
  });
  const completedBookings = await prisma.booking.count({
    where: {
      listing: stWhere,
      status: "COMPLETED",
      createdAt: { gte: start, lte: end },
    },
  });

  const reviewAgg = await prisma.review.aggregate({
    where: { listing: stWhere },
    _avg: { propertyRating: true },
    _count: { _all: true },
  });

  const listingIds = await prisma.shortTermListing.findMany({
    where: { ...stWhere, listingStatus: ListingStatus.PUBLISHED },
    select: { id: true },
    take: 8000,
  });
  const ids = listingIds.map((x) => x.id);

  let fraudHighRiskCount = 0;
  if (ids.length) {
    fraudHighRiskCount = await prisma.fraudRiskScore.count({
      where: {
        entityType: "listing",
        entityId: { in: ids },
        riskLevel: { in: ["high", "critical"] },
      },
    });
  }

  let avgListingRankingScore: number | null = null;
  let topListingScore: number | null = null;
  try {
    const rankRows = await prisma.listingRankingScore.findMany({
      where: { listingType: "bnhub", listingId: { in: ids.length ? ids : ["__none__"] } },
      select: { totalScore: true },
      take: 2000,
    });
    if (rankRows.length) {
      const sum = rankRows.reduce((a, r) => a + r.totalScore, 0);
      avgListingRankingScore = sum / rankRows.length;
      topListingScore = Math.max(...rankRows.map((r) => r.totalScore));
    }
  } catch {
    avgListingRankingScore = null;
  }

  let listingViews = 0;
  let saves = 0;
  try {
    listingViews = await prisma.buyerListingView.count({
      where: {
        createdAt: { gte: start, lte: end },
        fsboListing: fsboWhere,
      },
    });
    saves = await prisma.buyerSavedListing.count({
      where: {
        createdAt: { gte: start, lte: end },
        fsboListing: fsboWhere,
      },
    });
  } catch {
    listingViews = 0;
    saves = 0;
  }

  let growthConversations: {
    id: string;
    userId: string | null;
    outcome: string | null;
    highIntent: boolean;
    stage: string;
    contextJson: unknown;
  }[] = [];
  try {
    growthConversations = await prisma.growthAiConversation.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { id: true, userId: true, outcome: true, highIntent: true, stage: true, contextJson: true },
      take: 5000,
    });
  } catch {
    growthConversations = [];
  }

  const key = normalizeCityKey(cityKey);
  const convInCity = growthConversations.filter((c) => {
    const ctx = c.contextJson as { city?: string } | null;
    const raw = ctx?.city?.trim();
    if (!raw) return false;
    return normalizeCityKey(raw) === key;
  });

  const searchSessions = convInCity.length;
  const booked = convInCity.filter((c) => c.outcome === "booked").length;
  const stale = convInCity.filter((c) => c.outcome === "stale").length;
  const handoff = convInCity.filter((c) => c.outcome === "handoff").length;
  const hi = convInCity.filter((c) => c.highIntent).length;
  const n = Math.max(1, convInCity.length);

  const users = new Set(convInCity.map((c) => c.userId).filter(Boolean));
  const repeatVisitorCount = [...users].filter((uid) => {
    const uMsgs = convInCity.filter((c) => c.userId === uid).length;
    return uMsgs > 1;
  }).length;

  const checkoutStartedCount = convInCity.filter((c) =>
    ["closing", "converted"].includes(c.stage)
  ).length;

  const hostPerf = await prisma.hostPerformance.findMany({
    where: {
      host: {
        shortTermListings: { some: { ...stWhere, listingStatus: ListingStatus.PUBLISHED } },
      },
    },
    select: { score: true, cancellationRate: true, responseRate: true },
    take: 500,
  });
  const avgHostScore =
    hostPerf.length > 0 ? hostPerf.reduce((a, h) => a + h.score, 0) / hostPerf.length : null;

  const badges = await prisma.hostBadge.groupBy({
    by: ["badgeType"],
    where: {
      host: {
        shortTermListings: { some: { ...stWhere, listingStatus: ListingStatus.PUBLISHED } },
      },
      badgeType: { in: ["fast_responder", "reliable_host"] },
    },
    _count: { _all: true },
  });
  const fastResponderHostCount = badges.find((b) => b.badgeType === "fast_responder")?._count._all ?? 0;
  const reliableHostCount = badges.find((b) => b.badgeType === "reliable_host")?._count._all ?? 0;

  let trustObjectionRate = 0;
  try {
    const convIds = convInCity.map((c) => c.id);
    if (convIds.length) {
      const obj = await prisma.growthAiConversationMessage.count({
        where: {
          conversationId: { in: convIds },
          createdAt: { gte: start, lte: end },
          detectedObjection: { not: null },
        },
      });
      const msgs = await prisma.growthAiConversationMessage.count({
        where: { conversationId: { in: convIds }, createdAt: { gte: start, lte: end } },
      });
      trustObjectionRate = msgs > 0 ? obj / msgs : 0;
    }
  } catch {
    trustObjectionRate = 0;
  }

  const cityLabel = profileCityName?.trim() || expandCityKeyToDbNames(cityKey)[0] || "";
  const impressions = cityLabel
    ? await prisma.rankingImpressionLog
        .count({
          where: {
            listingType: "bnhub",
            createdAt: { gte: start, lte: end },
            city: { contains: cityLabel, mode: "insensitive" },
          },
        })
        .catch(() => 0)
    : 0;
  const clicks = cityLabel
    ? await prisma.rankingClickLog
        .count({
          where: {
            listingType: "bnhub",
            createdAt: { gte: start, lte: end },
          },
        })
        .catch(() => 0)
    : 0;
  const topCityCtr = impressions > 0 ? clicks / impressions : null;

  return {
    periodStart: start.toISOString(),
    periodEnd: end.toISOString(),
    cityKey,
    activeListingCount: activeBnhub + activeRe,
    activeBnhubListingCount: activeBnhub,
    activeRealEstateListingCount: activeRe,
    verifiedListingCount: verifiedBnhub + verifiedFsbo,
    verifiedHostCount,
    verifiedBrokerCount,
    searchSessions,
    listingViews,
    favoritesCount: saves,
    inquiryCount: convInCity.filter((c) => c.stage !== "new").length,
    checkoutStartedCount,
    bookingCount: bookingVolume,
    completedBookings,
    repeatVisitorCount,
    inquiryConversionRate: n > 0 ? booked / n : 0,
    checkoutToBookingRate: checkoutStartedCount > 0 ? booked / checkoutStartedCount : 0,
    bookedRate: n > 0 ? booked / n : 0,
    highIntentRate: n > 0 ? hi / n : 0,
    highIntentConversionRate: hi > 0 ? booked / hi : 0,
    staleRate: n > 0 ? stale / n : 0,
    handoffRate: n > 0 ? handoff / n : 0,
    avgReviewRating: reviewAgg._avg.propertyRating,
    totalReviewCount: reviewAgg._count._all,
    avgHostScore,
    fastResponderHostCount,
    reliableHostCount,
    fraudHighRiskCount,
    trustObjectionRate,
    brokerSlaHitRate: null,
    hostSlaHitRate: hostPerf.length
      ? hostPerf.filter((h) => h.responseRate >= 0.85).length / hostPerf.length
      : null,
    averageTimeToAssignment: null,
    averageTimeToFirstReply: null,
    reassignmentRate: null,
    avgListingRankingScore,
    topListingScore,
    topCityCtr,
    highExposureLowConversionCount: null,
    rankingImpressions: impressions,
    rankingClicks: clicks,
    recoveryFromAssistClose: 0,
    recoveryFromNudge: convInCity.filter((c) => c.stage === "converted").length,
  };
}

export async function computeDailyCityKpis(cityKey: string, targetDate = new Date()): Promise<CityKpiMetrics> {
  const key = normalizeCityKey(cityKey);
  const profile = await getCityOperationProfile(key);
  const day = utcDayStart(targetDate);
  const next = addDays(day, 1);
  return gatherCityMetrics(key, profile?.cityName, day, next);
}

export async function computeWeeklyCityKpis(cityKey: string, weekStart = new Date()): Promise<CityKpiMetrics> {
  const key = normalizeCityKey(cityKey);
  const profile = await getCityOperationProfile(key);
  const start = utcDayStart(weekStart);
  const end = addDays(start, 7);
  return gatherCityMetrics(key, profile?.cityName, start, end);
}

export async function saveCityKpiSnapshot(
  cityKey: string,
  snapshotType: "daily" | "weekly",
  snapshotDate: Date,
  metrics: CityKpiMetrics
): Promise<void> {
  const key = normalizeCityKey(cityKey);
  const day = utcDayStart(snapshotDate);
  await prisma.cityKpiSnapshot.upsert({
    where: {
      cityKey_snapshotType_snapshotDate: {
        cityKey: key,
        snapshotType,
        snapshotDate: day,
      },
    },
    create: {
      cityKey: key,
      snapshotType,
      snapshotDate: day,
      metricsJson: metrics as object,
    },
    update: { metricsJson: metrics as object },
  });
}

export async function getLatestStoredCityKpiMetrics(cityKey: string): Promise<CityKpiMetrics> {
  const key = normalizeCityKey(cityKey);
  const snap = await prisma.cityKpiSnapshot.findFirst({
    where: { cityKey: key, snapshotType: "daily" },
    orderBy: { snapshotDate: "desc" },
  });
  return (snap?.metricsJson as CityKpiMetrics) ?? {};
}

export async function computeAllActiveCitySnapshots(snapshotType: "daily" | "weekly"): Promise<number> {
  const profiles = await prisma.cityOperationProfile.findMany({
    where: { isActive: true },
    select: { cityKey: true },
  });
  let n = 0;
  const now = new Date();
  for (const p of profiles) {
    const metrics =
      snapshotType === "daily"
        ? await computeDailyCityKpis(p.cityKey, now)
        : await computeWeeklyCityKpis(p.cityKey, now);
    await saveCityKpiSnapshot(p.cityKey, snapshotType, now, metrics);
    n++;
  }
  return n;
}
