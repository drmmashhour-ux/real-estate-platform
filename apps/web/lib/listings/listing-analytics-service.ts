import { ListingAnalyticsKind, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { buildFsboPublicVisibilityWhere } from "@/lib/fsbo/listing-expiry";
import {
  computeRawDemandScore,
  getPriceMovementSignal,
  getPricingInsight,
  getUrgencyPresentation,
  hasReliableDemandSignal,
  normalizeDemandScore,
  priceMovementMessage,
  type DemandInputs,
  type UrgencyPresentation,
} from "@/lib/listings/listing-demand-engine";

export type ListingDemandUiPayload = {
  demandScore: number;
  urgency: UrgencyPresentation | null;
  pricingInsight: { headline: string; detail: string | null };
  priceMovementNote: string | null;
  badge: string | null;
  hasSignal: boolean;
  /** FSBO peer aggregate mean when sample ≥ 3; CRM/other flows may omit. */
  comparableMarketEstimateCents: number | null;
  comparablePeerCount: number | null;
};

const REFRESH_MIN_MS = 120_000;

async function countUniqueViews24hFsbo(fsboListingId: string): Promise<{ rows24h: number; unique24h: number }> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const rows24h = await prisma.buyerListingView.count({
    where: { fsboListingId, createdAt: { gte: since } },
  });
  const raw = await prisma.$queryRaw<Array<{ c: bigint }>>`
    SELECT COUNT(*)::bigint AS c
    FROM (
      SELECT DISTINCT COALESCE("user_id", ''), COALESCE("session_id", "id"::text)
      FROM "buyer_listing_views"
      WHERE "fsbo_listing_id" = ${fsboListingId}
        AND "created_at" >= ${since}
    ) sub
  `;
  const unique24h = Number(raw[0]?.c ?? 0);
  return { rows24h, unique24h };
}

/**
 * Recompute cached counters + demand score for an FSBO listing (throttled).
 */
export async function refreshFsboListingAnalytics(fsboListingId: string, currentPriceCents: number) {
  const existing = await prisma.listingAnalytics.findUnique({
    where: { kind_listingId: { kind: ListingAnalyticsKind.FSBO, listingId: fsboListingId } },
  });
  if (
    existing?.demandScoreComputedAt &&
    Date.now() - existing.demandScoreComputedAt.getTime() < REFRESH_MIN_MS
  ) {
    return existing;
  }

  const totalViews = await prisma.buyerListingView.count({ where: { fsboListingId } });
  const saves = await prisma.buyerSavedListing.count({ where: { fsboListingId } });
  const { rows24h, unique24h } = await countUniqueViews24hFsbo(fsboListingId);

  const contactClicks = existing?.contactClicks ?? 0;
  const bookingAttempts = existing?.bookingAttempts ?? 0;
  const bookings = existing?.bookings ?? 0;

  const inputs: DemandInputs = {
    views24h: rows24h,
    uniqueViews24h: unique24h,
    contactClicks,
    bookingAttempts,
    saves,
  };
  const demandScore = normalizeDemandScore(computeRawDemandScore(inputs));

  const row = await prisma.listingAnalytics.upsert({
    where: { kind_listingId: { kind: ListingAnalyticsKind.FSBO, listingId: fsboListingId } },
    create: {
      kind: ListingAnalyticsKind.FSBO,
      listingId: fsboListingId,
      viewsTotal: totalViews,
      saves,
      views24hCached: rows24h,
      uniqueViews24hCached: unique24h,
      contactClicks: 0,
      bookingAttempts: 0,
      bookings: 0,
      demandScore,
      demandScoreComputedAt: new Date(),
    },
    update: {
      viewsTotal: totalViews,
      saves,
      views24hCached: rows24h,
      uniqueViews24hCached: unique24h,
      demandScore,
      demandScoreComputedAt: new Date(),
    },
  });

  const lastPrice = await prisma.listingPriceHistory.findFirst({
    where: { kind: ListingAnalyticsKind.FSBO, listingId: fsboListingId },
    orderBy: { recordedAt: "desc" },
  });
  if (!lastPrice || lastPrice.priceCents !== currentPriceCents) {
    await prisma.listingPriceHistory.create({
      data: {
        kind: ListingAnalyticsKind.FSBO,
        listingId: fsboListingId,
        priceCents: currentPriceCents,
      },
    });
  }

  return row;
}

export async function incrementFsboContactClick(fsboListingId: string) {
  const l = await prisma.fsboListing.findUnique({
    where: { id: fsboListingId },
    select: { priceCents: true },
  });
  if (!l) return;
  await prisma.listingAnalytics.upsert({
    where: { kind_listingId: { kind: ListingAnalyticsKind.FSBO, listingId: fsboListingId } },
    create: {
      kind: ListingAnalyticsKind.FSBO,
      listingId: fsboListingId,
      contactClicks: 1,
    },
    update: { contactClicks: { increment: 1 } },
  });
  await refreshFsboListingAnalytics(fsboListingId, l.priceCents);
}

/** CRM listing: increment page-view counter (no per-session 24h table). */
/** Recompute CRM demand score after counter changes (e.g. contact click). */
export async function recomputeCrmListingDemandScore(crmListingId: string) {
  const row = await prisma.listingAnalytics.findUnique({
    where: { kind_listingId: { kind: ListingAnalyticsKind.CRM, listingId: crmListingId } },
  });
  if (!row) return;
  const inputs: DemandInputs = {
    views24h: Math.min(row.views24hCached, 80),
    uniqueViews24h: Math.min(row.uniqueViews24hCached, 80),
    contactClicks: row.contactClicks,
    bookingAttempts: row.bookingAttempts,
    saves: row.saves,
  };
  const demandScore = normalizeDemandScore(computeRawDemandScore(inputs));
  await prisma.listingAnalytics.update({
    where: { id: row.id },
    data: { demandScore, demandScoreComputedAt: new Date() },
  });
}

export async function incrementCrmListingView(crmListingId: string) {
  await prisma.listingAnalytics.upsert({
    where: { kind_listingId: { kind: ListingAnalyticsKind.CRM, listingId: crmListingId } },
    create: {
      kind: ListingAnalyticsKind.CRM,
      listingId: crmListingId,
      viewsTotal: 1,
      views24hCached: 1,
      uniqueViews24hCached: 1,
    },
    update: {
      viewsTotal: { increment: 1 },
      views24hCached: { increment: 1 },
      uniqueViews24hCached: { increment: 1 },
    },
  });
  const row = await prisma.listingAnalytics.findUnique({
    where: { kind_listingId: { kind: ListingAnalyticsKind.CRM, listingId: crmListingId } },
  });
  if (!row) return;
  const inputs: DemandInputs = {
    views24h: Math.min(row.views24hCached, 80),
    uniqueViews24h: Math.min(row.uniqueViews24hCached, 80),
    contactClicks: row.contactClicks,
    bookingAttempts: row.bookingAttempts,
    saves: row.saves,
  };
  const demandScore = normalizeDemandScore(computeRawDemandScore(inputs));
  await prisma.listingAnalytics.update({
    where: { id: row.id },
    data: { demandScore, demandScoreComputedAt: new Date() },
  });
}

export async function incrementBnhubBookingAttempt(shortTermListingId: string) {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: shortTermListingId },
    select: { nightPriceCents: true },
  });
  if (!listing) return;
  const price = listing.nightPriceCents ?? 0;
  await prisma.listingAnalytics.upsert({
    where: { kind_listingId: { kind: ListingAnalyticsKind.BNHUB, listingId: shortTermListingId } },
    create: {
      kind: ListingAnalyticsKind.BNHUB,
      listingId: shortTermListingId,
      bookingAttempts: 1,
    },
    update: { bookingAttempts: { increment: 1 } },
  });
  await refreshBnhubListingAnalytics(shortTermListingId, price);
}

export async function incrementBnhubBookingCompleted(shortTermListingId: string) {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: shortTermListingId },
    select: { nightPriceCents: true },
  });
  if (!listing) return;
  const price = listing.nightPriceCents ?? 0;
  await prisma.listingAnalytics.upsert({
    where: { kind_listingId: { kind: ListingAnalyticsKind.BNHUB, listingId: shortTermListingId } },
    create: {
      kind: ListingAnalyticsKind.BNHUB,
      listingId: shortTermListingId,
      bookings: 1,
    },
    update: { bookings: { increment: 1 } },
  });
  await refreshBnhubListingAnalytics(shortTermListingId, price);
}

async function refreshBnhubListingAnalytics(shortTermListingId: string, priceCents: number) {
  const row = await prisma.listingAnalytics.findUnique({
    where: { kind_listingId: { kind: ListingAnalyticsKind.BNHUB, listingId: shortTermListingId } },
  });
  if (!row) return;
  const inputs: DemandInputs = {
    views24h: row.views24hCached,
    uniqueViews24h: row.uniqueViews24hCached,
    contactClicks: row.contactClicks,
    bookingAttempts: row.bookingAttempts,
    saves: row.saves,
  };
  const demandScore = normalizeDemandScore(computeRawDemandScore(inputs));
  await prisma.listingAnalytics.update({
    where: { id: row.id },
    data: { demandScore, demandScoreComputedAt: new Date() },
  });
  const lastPrice = await prisma.listingPriceHistory.findFirst({
    where: { kind: ListingAnalyticsKind.BNHUB, listingId: shortTermListingId },
    orderBy: { recordedAt: "desc" },
  });
  if (!lastPrice || lastPrice.priceCents !== priceCents) {
    await prisma.listingPriceHistory.create({
      data: {
        kind: ListingAnalyticsKind.BNHUB,
        listingId: shortTermListingId,
        priceCents,
      },
    });
  }
}

async function fsboMarketPeerStats(params: {
  city: string;
  bedrooms: number | null;
  propertyType: string | null;
  excludeId: string;
}): Promise<{ avgCents: number | null; peerCount: number }> {
  const baseWhere: Prisma.FsboListingWhereInput = {
    ...buildFsboPublicVisibilityWhere(),
    city: { equals: params.city, mode: "insensitive" },
    id: { not: params.excludeId },
  };
  if (params.bedrooms != null) {
    baseWhere.bedrooms = params.bedrooms;
  }
  if (params.propertyType?.trim()) {
    baseWhere.propertyType = { equals: params.propertyType, mode: "insensitive" };
  }
  const agg = await prisma.fsboListing.aggregate({
    where: baseWhere,
    _avg: { priceCents: true },
    _count: { id: true },
  });
  const peerCount = agg._count.id ?? 0;
  if (!agg._avg.priceCents || peerCount < 3) {
    return { avgCents: null, peerCount };
  }
  return { avgCents: Math.round(agg._avg.priceCents), peerCount };
}

export async function buildFsboPublicDemandUi(
  fsboListingId: string,
  listing: {
    priceCents: number;
    city: string;
    bedrooms: number | null;
    propertyType: string | null;
  }
): Promise<ListingDemandUiPayload> {
  await refreshFsboListingAnalytics(fsboListingId, listing.priceCents);
  const row = await prisma.listingAnalytics.findUnique({
    where: { kind_listingId: { kind: ListingAnalyticsKind.FSBO, listingId: fsboListingId } },
  });
  const peerStatsPromise = fsboMarketPeerStats({
    city: listing.city,
    bedrooms: listing.bedrooms,
    propertyType: listing.propertyType,
    excludeId: fsboListingId,
  });

  if (!row) {
    const peerStatsEarly = await peerStatsPromise;
    return {
      demandScore: 0,
      urgency: null,
      pricingInsight: getPricingInsight({
        listingPriceCents: listing.priceCents,
        marketAvgCents: peerStatsEarly.avgCents,
        demandScore: 0,
      }),
      priceMovementNote: null,
      badge: null,
      hasSignal: false,
      comparableMarketEstimateCents: peerStatsEarly.avgCents,
      comparablePeerCount: peerStatsEarly.peerCount,
    };
  }

  const inputs: DemandInputs = {
    views24h: row.views24hCached,
    uniqueViews24h: row.uniqueViews24hCached,
    contactClicks: row.contactClicks,
    bookingAttempts: row.bookingAttempts,
    saves: row.saves,
  };
  const peerStats = await peerStatsPromise;
  const marketAvg = peerStats.avgCents;
  const pricingInsight = getPricingInsight({
    listingPriceCents: listing.priceCents,
    marketAvgCents: marketAvg,
    demandScore: row.demandScore,
  });

  const hist = await prisma.listingPriceHistory.findMany({
    where: { kind: ListingAnalyticsKind.FSBO, listingId: fsboListingId },
    orderBy: { recordedAt: "desc" },
    take: 2,
  });
  const move =
    hist.length >= 2 ? getPriceMovementSignal(hist[0]!.priceCents, hist[1]!.priceCents) : null;
  const priceMovementNote = move ? priceMovementMessage(move) : null;

  const urgency = getUrgencyPresentation(inputs, row.demandScore);
  const hasSignal = hasReliableDemandSignal(inputs, row.demandScore);

  return {
    demandScore: row.demandScore,
    urgency: hasSignal ? urgency : null,
    pricingInsight,
    priceMovementNote,
    badge: hasSignal ? urgency?.badge ?? null : null,
    hasSignal,
    comparableMarketEstimateCents: marketAvg,
    comparablePeerCount: peerStats.peerCount,
  };
}

/** CRM listings: lighter analytics (no BuyerListingView stream). */
export async function buildCrmPublicDemandUi(
  crmListingId: string,
  listing: { priceCents: number }
): Promise<ListingDemandUiPayload> {
  const row = await prisma.listingAnalytics.findUnique({
    where: { kind_listingId: { kind: ListingAnalyticsKind.CRM, listingId: crmListingId } },
  });
  if (!row) {
    return {
      demandScore: 0,
      urgency: null,
      pricingInsight: getPricingInsight({
        listingPriceCents: listing.priceCents,
        marketAvgCents: null,
        demandScore: 0,
      }),
      priceMovementNote: null,
      badge: null,
      hasSignal: false,
      comparableMarketEstimateCents: null,
      comparablePeerCount: null,
    };
  }
  const inputs: DemandInputs = {
    views24h: row.views24hCached,
    uniqueViews24h: row.uniqueViews24hCached,
    contactClicks: row.contactClicks,
    bookingAttempts: row.bookingAttempts,
    saves: row.saves,
  };
  const pricingInsight = getPricingInsight({
    listingPriceCents: listing.priceCents,
    marketAvgCents: null,
    demandScore: row.demandScore,
  });
  const urgency = getUrgencyPresentation(inputs, row.demandScore);
  const hasSignal = hasReliableDemandSignal(inputs, row.demandScore);
  return {
    demandScore: row.demandScore,
    urgency: hasSignal ? urgency : null,
    pricingInsight,
    priceMovementNote: null,
    badge: hasSignal ? urgency?.badge ?? null : null,
    hasSignal,
    comparableMarketEstimateCents: null,
    comparablePeerCount: null,
  };
}

/** Increment share intent (copy, native share, or external share). Best-effort, rate-limited at route. */
export async function incrementListingShareCount(kind: ListingAnalyticsKind, listingId: string) {
  await prisma.listingAnalytics.upsert({
    where: { kind_listingId: { kind, listingId } },
    create: { kind, listingId, shareCount: 1 },
    update: { shareCount: { increment: 1 } },
  });
}

export async function incrementUnlockCheckoutStart(kind: ListingAnalyticsKind, listingId: string) {
  await prisma.listingAnalytics.upsert({
    where: { kind_listingId: { kind, listingId } },
    create: { kind, listingId, unlockCheckoutStarts: 1 },
    update: { unlockCheckoutStarts: { increment: 1 } },
  });
}

export async function incrementUnlockCheckoutSuccess(kind: ListingAnalyticsKind, listingId: string) {
  await prisma.listingAnalytics.upsert({
    where: { kind_listingId: { kind, listingId } },
    create: { kind, listingId, unlockCheckoutSuccesses: 1 },
    update: { unlockCheckoutSuccesses: { increment: 1 } },
  });
}

export type ListingAnalyticsSnapshot = {
  viewsTotal: number;
  views24h: number;
  uniqueViews24h: number;
  saves: number;
  contactClicks: number;
  bookingAttempts: number;
  bookings: number;
  shareCount: number;
  unlockCheckoutStarts: number;
  unlockCheckoutSuccesses: number;
  demandScore: number;
  updatedAt: Date;
};

export async function getListingAnalyticsSnapshot(
  kind: ListingAnalyticsKind,
  listingId: string
): Promise<ListingAnalyticsSnapshot | null> {
  const row = await prisma.listingAnalytics.findUnique({
    where: { kind_listingId: { kind, listingId } },
  });
  if (!row) return null;
  return {
    viewsTotal: row.viewsTotal,
    views24h: row.views24hCached,
    uniqueViews24h: row.uniqueViews24hCached,
    saves: row.saves,
    contactClicks: row.contactClicks,
    bookingAttempts: row.bookingAttempts,
    bookings: row.bookings,
    shareCount: row.shareCount,
    unlockCheckoutStarts: row.unlockCheckoutStarts,
    unlockCheckoutSuccesses: row.unlockCheckoutSuccesses,
    demandScore: row.demandScore,
    updatedAt: row.updatedAt,
  };
}

