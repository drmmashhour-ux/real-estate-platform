/**
 * Aggregates BNHUB listing signals, search events, and bookings for admin market intelligence.
 */

import { BookingStatus, ListingStatus, SearchEventType } from "@prisma/client";
import { prisma } from "@/lib/db";

const WINDOW_DAYS = 30;

function priceCompetitiveness01(nightPriceCents: number, cityAvg: number | null): number {
  if (!cityAvg || cityAvg <= 0) return 0.55;
  const ratio = nightPriceCents / cityAvg;
  if (ratio <= 0.88) return 1;
  if (ratio <= 0.98) return 0.92;
  if (ratio <= 1.08) return 0.78;
  if (ratio <= 1.25) return 0.55;
  return 0.35;
}

/**
 * Single 0–100 score: views, engagement (CTR/conversion), bookings, price vs city peers.
 */
export function computeListingPerformanceScore(
  metrics: {
    views30d: number;
    bookings30d: number;
    ctr: number | null;
    conversionRate: number | null;
  } | null,
  nightPriceCents: number,
  cityAvgNightCents: number | null
): number {
  const v = Math.log1p(metrics?.views30d ?? 0);
  const reach = v / (v + Math.log1p(120));
  const ctr = metrics?.ctr != null && Number.isFinite(metrics.ctr) ? metrics.ctr : 0;
  const conv = metrics?.conversionRate != null && Number.isFinite(metrics.conversionRate) ? metrics.conversionRate : 0;
  const bookings = Math.log1p(metrics?.bookings30d ?? 0);
  const engagement = Math.min(1, ctr * 1.1 + conv * 1.4 + bookings / (bookings + Math.log1p(8)));
  const price = priceCompetitiveness01(nightPriceCents, cityAvgNightCents);
  const raw = 0.32 * reach + 0.38 * engagement + 0.3 * price;
  return Math.max(0, Math.min(100, Math.round(raw * 100)));
}

export type PlatformMarketIntelligence = {
  generatedAt: string;
  windowDays: number;
  mostSearchedLocations: { city: string; searchCount: number }[];
  trendingCities: { city: string; recent14d: number; prior14d: number; changeRatio: number | null }[];
  mostViewedListings: Array<{
    listingId: string;
    listingCode: string | null;
    title: string;
    city: string;
    views30d: number;
    bookings30d: number;
    performanceScore: number;
  }>;
  weakListings: Array<{
    listingId: string;
    listingCode: string | null;
    title: string;
    city: string;
    views30d: number;
    conversionRate: number | null;
    performanceScore: number;
  }>;
  priceRangeBuckets: { label: string; minDollars: number; maxDollars: number | null; count: number }[];
  bookingFunnel: {
    searches: number;
    listingViews: number;
    clicks: number;
    bookings: number;
    approxViewToBookingRate: number | null;
  };
  behaviorSummary: {
    searchEvents: number;
    listingViewEvents: number;
    listingClickEvents: number;
    bookingAttempts: number;
    bookingSuccessEvents: number;
    note: string;
  };
  highDemandCheckInDates: { date: string; bookingCount: number }[];
  opportunities: { title: string; detail: string }[];
  segmentSignals: { segmentKey: string; trendScore: number; impressionCount: number }[];
};

async function cityAvgNightByCity(): Promise<Map<string, number>> {
  const rows = await prisma.shortTermListing.groupBy({
    by: ["city"],
    where: { listingStatus: ListingStatus.PUBLISHED },
    _avg: { nightPriceCents: true },
  });
  const m = new Map<string, number>();
  for (const r of rows) {
    const avg = r._avg.nightPriceCents;
    if (avg != null && avg > 0) m.set(r.city.trim().toLowerCase(), avg);
  }
  return m;
}

export async function getPlatformMarketIntelligence(): Promise<PlatformMarketIntelligence> {
  const now = Date.now();
  const since30 = new Date(now - WINDOW_DAYS * 86400000);
  const since14 = new Date(now - 14 * 86400000);
  const since28 = new Date(now - 28 * 86400000);

  const cityAvgMap = await cityAvgNightByCity();

  const [
    topCitiesRaw,
    funnelCounts,
    topMetrics,
    weakPool,
    priceHist,
    segments,
    behaviorCounts,
    cityRecent,
    cityPrior,
  ] = await Promise.all([
    prisma.$queryRaw<{ city: string; c: bigint }[]>`
      SELECT TRIM(COALESCE(se.metadata->>'city', '')) AS city, COUNT(*)::bigint AS c
      FROM search_events se
      WHERE se.event_type::text = 'SEARCH'
        AND se.created_at >= ${since30}
        AND se.metadata IS NOT NULL
        AND LENGTH(TRIM(COALESCE(se.metadata->>'city', ''))) > 0
      GROUP BY 1
      ORDER BY c DESC
      LIMIT 20
    `.catch(() => [] as { city: string; c: bigint }[]),
    prisma.searchEvent.groupBy({
      by: ["eventType"],
      where: { createdAt: { gte: since30 } },
      _count: { _all: true },
    }),
    prisma.listingSearchMetrics.findMany({
      where: { views30d: { gt: 0 } },
      orderBy: { views30d: "desc" },
      take: 12,
      include: {
        listing: {
          select: {
            id: true,
            listingCode: true,
            title: true,
            city: true,
            nightPriceCents: true,
            listingStatus: true,
          },
        },
      },
    }),
    prisma.listingSearchMetrics.findMany({
      where: { views30d: { gte: 5 } },
      orderBy: { views30d: "desc" },
      take: 48,
      include: {
        listing: {
          select: {
            id: true,
            listingCode: true,
            title: true,
            city: true,
            nightPriceCents: true,
            listingStatus: true,
          },
        },
      },
    }),
    prisma.$queryRaw<{ bucket: number; c: bigint }[]>`
      SELECT
        CASE
          WHEN l.night_price_cents < 5000 THEN 0
          WHEN l.night_price_cents < 10000 THEN 1
          WHEN l.night_price_cents < 15000 THEN 2
          WHEN l.night_price_cents < 25000 THEN 3
          WHEN l.night_price_cents < 40000 THEN 4
          ELSE 5
        END AS bucket,
        COUNT(*)::bigint AS c
      FROM bnhub_listings l
      WHERE l.listing_status::text = 'PUBLISHED'
      GROUP BY 1
      ORDER BY 1
    `.catch(() => [] as { bucket: number; c: bigint }[]),
    prisma.marketSegmentLearningStats.findMany({
      orderBy: [{ trendScore: "desc" }, { impressionCount: "desc" }],
      take: 12,
    }),
    prisma.userBehaviorEvent.groupBy({
      by: ["eventType"],
      where: { createdAt: { gte: since30 } },
      _count: { _all: true },
    }),
    prisma.$queryRaw<{ city: string; c: bigint }[]>`
      SELECT TRIM(COALESCE(se.metadata->>'city', '')) AS city, COUNT(*)::bigint AS c
      FROM search_events se
      WHERE se.event_type::text = 'SEARCH'
        AND se.created_at >= ${since14}
        AND se.metadata IS NOT NULL
        AND LENGTH(TRIM(COALESCE(se.metadata->>'city', ''))) > 0
      GROUP BY 1
    `.catch(() => [] as { city: string; c: bigint }[]),
    prisma.$queryRaw<{ city: string; c: bigint }[]>`
      SELECT TRIM(COALESCE(se.metadata->>'city', '')) AS city, COUNT(*)::bigint AS c
      FROM search_events se
      WHERE se.event_type::text = 'SEARCH'
        AND se.created_at >= ${since28}
        AND se.created_at < ${since14}
        AND se.metadata IS NOT NULL
        AND LENGTH(TRIM(COALESCE(se.metadata->>'city', ''))) > 0
      GROUP BY 1
    `.catch(() => [] as { city: string; c: bigint }[]),
  ]);

  const bookingRows = await prisma.booking.findMany({
    where: {
      createdAt: { gte: since30 },
      status: {
        in: [
          BookingStatus.CONFIRMED,
          BookingStatus.COMPLETED,
          BookingStatus.AWAITING_HOST_APPROVAL,
          BookingStatus.PENDING,
        ],
      },
    },
    select: { checkIn: true },
  });
  const checkInByDay = new Map<string, number>();
  for (const b of bookingRows) {
    const key = b.checkIn.toISOString().slice(0, 10);
    checkInByDay.set(key, (checkInByDay.get(key) ?? 0) + 1);
  }
  const highDemandCheckInDates = [...checkInByDay.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 14)
    .map(([date, bookingCount]) => ({ date, bookingCount }));

  const funnelMap = new Map(funnelCounts.map((x) => [x.eventType, x._count._all]));
  const searches = funnelMap.get(SearchEventType.SEARCH) ?? 0;
  const listingViews = funnelMap.get(SearchEventType.VIEW) ?? 0;
  const clicks = funnelMap.get(SearchEventType.CLICK) ?? 0;
  const bookings = funnelMap.get(SearchEventType.BOOK) ?? 0;
  const approxRate =
    listingViews > 0 && bookings >= 0 ? Math.min(1, bookings / listingViews) : null;

  const behaviorMap = new Map(behaviorCounts.map((x) => [x.eventType, x._count._all]));

  const recentMap = new Map(cityRecent.map((r) => [r.city.toLowerCase(), Number(r.c)]));
  const priorMap = new Map(cityPrior.map((r) => [r.city.toLowerCase(), Number(r.c)]));
  const cityLabel = new Map<string, string>();
  for (const r of [...cityRecent, ...cityPrior]) {
    const k = r.city.trim().toLowerCase();
    if (!cityLabel.has(k)) cityLabel.set(k, r.city.trim());
  }
  const allTrendCities = new Set([...recentMap.keys(), ...priorMap.keys()]);
  const trendingCities = [...allTrendCities]
    .map((cityKey) => {
      const a = recentMap.get(cityKey) ?? 0;
      const b = priorMap.get(cityKey) ?? 0;
      const changeRatio = b > 0 ? (a - b) / b : a > 0 ? null : 0;
      return {
        city: cityKey,
        recent14d: a,
        prior14d: b,
        changeRatio,
      };
    })
    .filter((x) => x.recent14d + x.prior14d >= 3)
    .sort((x, y) => {
      const sa = (x.changeRatio ?? 0) * Math.log1p(x.recent14d);
      const sb = (y.changeRatio ?? 0) * Math.log1p(y.recent14d);
      return sb - sa;
    })
    .slice(0, 12)
    .map((x) => ({
      city: cityLabel.get(x.city) ?? x.city,
      recent14d: x.recent14d,
      prior14d: x.prior14d,
      changeRatio: x.changeRatio,
    }));

  const bucketLabels: { label: string; minDollars: number; maxDollars: number | null }[] = [
    { label: "Under $50", minDollars: 0, maxDollars: 50 },
    { label: "$50 – $100", minDollars: 50, maxDollars: 100 },
    { label: "$100 – $150", minDollars: 100, maxDollars: 150 },
    { label: "$150 – $250", minDollars: 150, maxDollars: 250 },
    { label: "$250 – $400", minDollars: 250, maxDollars: 400 },
    { label: "$400+", minDollars: 400, maxDollars: null },
  ];
  const priceRangeBuckets = bucketLabels.map((b, i) => {
    const row = priceHist.find((p) => p.bucket === i);
    return { ...b, count: row ? Number(row.c) : 0 };
  });

  function scoreRow(
    m: {
      views30d: number;
      bookings30d: number;
      ctr: number | null;
      conversionRate: number | null;
    },
    city: string,
    nightPriceCents: number
  ): number {
    const avg = cityAvgMap.get(city.trim().toLowerCase()) ?? null;
    return computeListingPerformanceScore(m, nightPriceCents, avg);
  }

  const mostViewedListings = topMetrics
    .filter((r) => r.listing.listingStatus === ListingStatus.PUBLISHED)
    .map((r) => ({
      listingId: r.listingId,
      listingCode: r.listing.listingCode,
      title: r.listing.title,
      city: r.listing.city,
      views30d: r.views30d,
      bookings30d: r.bookings30d,
      performanceScore: scoreRow(r, r.listing.city, r.listing.nightPriceCents),
    }));

  const weakListings = weakCandidates
    .filter((r) => r.listing.listingStatus === ListingStatus.PUBLISHED)
    .map((r) => ({
      listingId: r.listingId,
      listingCode: r.listing.listingCode,
      title: r.listing.title,
      city: r.listing.city,
      views30d: r.views30d,
      conversionRate: r.conversionRate,
      performanceScore: scoreRow(r, r.listing.city, r.listing.nightPriceCents),
    }))
    .sort((a, b) => a.performanceScore - b.performanceScore)
    .slice(0, 12);

  const opportunities: { title: string; detail: string }[] = [];
  const searchTop = topCitiesRaw.slice(0, 8);
  for (const row of searchTop) {
    const cityName = row.city;
    const pubCount = await prisma.shortTermListing.count({
      where: {
        listingStatus: ListingStatus.PUBLISHED,
        city: { equals: cityName, mode: "insensitive" },
      },
    });
    if (pubCount < 5 && Number(row.c) >= 5) {
      opportunities.push({
        title: `Demand signal in ${cityName}`,
        detail: `Searches are elevated but only ${pubCount} published stays match this city — onboarding or inventory campaigns may convert well.`,
      });
    }
  }
  if (segments[0]) {
    opportunities.push({
      title: "Strong segment interest",
      detail: `Segment “${segments[0].segmentKey.slice(0, 80)}${segments[0].segmentKey.length > 80 ? "…" : ""}” shows elevated trend score (${segments[0].trendScore.toFixed(2)}).`,
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    windowDays: WINDOW_DAYS,
    mostSearchedLocations: topCitiesRaw.map((r) => ({
      city: r.city,
      searchCount: Number(r.c),
    })),
    trendingCities,
    mostViewedListings,
    weakListings,
    priceRangeBuckets,
    bookingFunnel: {
      searches,
      listingViews,
      clicks,
      bookings,
      approxViewToBookingRate: approxRate,
    },
    behaviorSummary: {
      searchEvents: searches,
      listingViewEvents: behaviorMap.get("LISTING_IMPRESSION") ?? 0,
      listingClickEvents: behaviorMap.get("LISTING_CLICK") ?? 0,
      bookingAttempts: behaviorMap.get("LISTING_BOOKING_ATTEMPT") ?? 0,
      bookingSuccessEvents: behaviorMap.get("LISTING_BOOKING_SUCCESS") ?? 0,
      note:
        "Search funnel uses `search_events`; BNHUB UI learning uses `user_behavior_events`. Ratios are directional, not session-cohort perfect.",
    },
    highDemandCheckInDates,
    opportunities: opportunities.slice(0, 8),
    segmentSignals: segments.map((s) => ({
      segmentKey: s.segmentKey,
      trendScore: s.trendScore,
      impressionCount: s.impressionCount,
    })),
  };
}
