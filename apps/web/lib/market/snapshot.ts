import { BookingStatus, SystemAlertSeverity, type PlatformMarketPulse, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { computeTrend } from "@/lib/market/trends";

export const MARKET_WATCH_DATA_SCOPE =
  "Data source: Platform activity (LECIPM). Sold counts use verified FSBO status on-platform. Not a full-market census.";

export const MARKET_WATCH_PLATFORM_LABEL = "Platform Data Only";

function startOfUtcDay(d = new Date()): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function endOfUtcDay(start: Date): Date {
  const e = new Date(start);
  e.setUTCDate(e.getUTCDate() + 1);
  return e;
}

export type LiveMarketMetrics = {
  date: Date;
  visitorsCount: number;
  reservationsCount: number;
  listingsCount: number;
  soldCount: number;
  dealsDetected: number;
  buyBoxMatches: number;
  source: "platform";
  metadata: Prisma.InputJsonValue;
};

export type MarketPulseResponse = {
  snapshot: {
    id?: string;
    date: string;
    visitorsCount: number | null;
    reservationsCount: number | null;
    listingsCount: number | null;
    soldCount: number | null;
    dealsDetected: number | null;
    buyBoxMatches: number | null;
    source: string;
    metadata: unknown;
    createdAt?: string;
  };
  trends: {
    visitorsPct: number;
    reservationsPct: number;
    listingsPct: number;
    soldPct: number;
    dealsPct: number;
    buyBoxPct: number;
  };
  dataScopeLabel: string;
  scopeNote: string;
};

/**
 * Aggregates same-day platform metrics (UTC day). Visitors = analytics funnel events;
 * reservations = BNHub bookings; listings = FSBO + CRM rows created today;
 * sold = FSBO rows marked SOLD with `updatedAt` in today’s window.
 */
export async function computeLiveMarketMetrics(): Promise<Omit<LiveMarketMetrics, "metadata"> & { metadata: Prisma.InputJsonValue }> {
  const dayStart = startOfUtcDay();
  const dayEnd = endOfUtcDay(dayStart);

  const [
    visitorsCount,
    reservationsCount,
    fsboNewCount,
    crmListingNewCount,
    soldCount,
    dealsDetected,
    buyBoxMatches,
  ] = await Promise.all([
    prisma.analyticsFunnelEvent.count({
      where: { createdAt: { gte: dayStart, lt: dayEnd } },
    }),
    prisma.booking.count({
      where: {
        createdAt: { gte: dayStart, lt: dayEnd },
        status: {
          in: [
            BookingStatus.PENDING,
            BookingStatus.AWAITING_HOST_APPROVAL,
            BookingStatus.CONFIRMED,
            BookingStatus.COMPLETED,
          ],
        },
      },
    }),
    prisma.fsboListing.count({
      where: { createdAt: { gte: dayStart, lt: dayEnd } },
    }),
    prisma.listing.count({
      where: { createdAt: { gte: dayStart, lt: dayEnd } },
    }),
    prisma.fsboListing.count({
      where: {
        status: "SOLD",
        updatedAt: { gte: dayStart, lt: dayEnd },
      },
    }),
    prisma.deal.count({
      where: { createdAt: { gte: dayStart, lt: dayEnd } },
    }),
    prisma.lecipmProactiveSuggestion.count({
      where: {
        suggestionType: "buy_box",
        createdAt: { gte: dayStart, lt: dayEnd },
      },
    }),
  ]);

  const listingsCount = fsboNewCount + crmListingNewCount;

  const listingsByChannel = { fsbo: fsboNewCount, crm: crmListingNewCount };

  const metadata: Prisma.InputJsonValue = {
    dataScopeLabel: MARKET_WATCH_PLATFORM_LABEL,
    scopeNote: MARKET_WATCH_DATA_SCOPE,
    listingsByChannel,
    velocityNote:
      listingsCount + reservationsCount > 0
        ? "Market velocity (derived): same-day listings plus reservations activity."
        : "Thin activity window — velocity is informational only.",
    priceTrendNote:
      "Price movement trends require a dedicated time series feed; not computed in this pulse.",
  };

  return {
    date: dayStart,
    visitorsCount,
    reservationsCount,
    listingsCount,
    soldCount,
    dealsDetected,
    buyBoxMatches,
    source: "platform",
    metadata,
  };
}

async function maybeCreateTrafficSpikeAlert(args: {
  currentVisitors: number;
  previousVisitors: number | null;
  dayStart: Date;
}) {
  const { currentVisitors, previousVisitors, dayStart } = args;
  if (previousVisitors == null || previousVisitors < 10) return;
  if (currentVisitors <= previousVisitors * 1.5) return;

  const existing = await prisma.systemAlert.findFirst({
    where: {
      alertType: "MARKET_WATCH_TRAFFIC_SPIKE",
      createdAt: { gte: dayStart },
    },
  });
  if (existing) return;

  await prisma.systemAlert.create({
    data: {
      alertType: "MARKET_WATCH_TRAFFIC_SPIKE",
      severity: SystemAlertSeverity.INFO,
      message:
        "Traffic spike detected: analytics funnel volume is materially higher than the prior recorded pulse.",
      currentValue: currentVisitors,
      threshold: previousVisitors * 1.5,
      metadata: { previousVisitors, dayStart: dayStart.toISOString() },
    },
  });
}

/** Persist a pulse row and optionally compare to the latest prior snapshot for spike alerts. */
export async function buildAndPersistMarketSnapshot(): Promise<{
  snapshot: PlatformMarketPulse;
  trends: MarketPulseResponse["trends"];
}> {
  const prior = await prisma.platformMarketPulse.findFirst({
    where: { source: "platform" },
    orderBy: { createdAt: "desc" },
  });

  const live = await computeLiveMarketMetrics();
  const trends = computeSnapshotTrends(live, prior);

  const snapshot = await prisma.platformMarketPulse.create({
    data: {
      date: live.date,
      visitorsCount: live.visitorsCount,
      reservationsCount: live.reservationsCount,
      listingsCount: live.listingsCount,
      soldCount: live.soldCount,
      dealsDetected: live.dealsDetected,
      buyBoxMatches: live.buyBoxMatches,
      source: live.source,
      metadata: live.metadata,
    },
  });

  await maybeCreateTrafficSpikeAlert({
    currentVisitors: live.visitorsCount,
    previousVisitors: prior?.visitorsCount ?? null,
    dayStart: live.date,
  });

  return { snapshot, trends };
}

function metricsFromSnapshotRow(row: {
  visitorsCount: number | null;
  reservationsCount: number | null;
  listingsCount: number | null;
  soldCount: number | null;
  dealsDetected: number | null;
  buyBoxMatches: number | null;
}) {
  return {
    v: row.visitorsCount ?? 0,
    r: row.reservationsCount ?? 0,
    l: row.listingsCount ?? 0,
    s: row.soldCount ?? 0,
    d: row.dealsDetected ?? 0,
    b: row.buyBoxMatches ?? 0,
  };
}

export function computeSnapshotTrends(
  live: {
    visitorsCount: number;
    reservationsCount: number;
    listingsCount: number;
    soldCount: number;
    dealsDetected: number;
    buyBoxMatches: number;
  },
  prior: {
    visitorsCount: number | null;
    reservationsCount: number | null;
    listingsCount: number | null;
    soldCount: number | null;
    dealsDetected: number | null;
    buyBoxMatches: number | null;
  } | null,
): MarketPulseResponse["trends"] {
  const p = prior ? metricsFromSnapshotRow(prior) : null;
  const c = metricsFromSnapshotRow(live);
  return {
    visitorsPct: computeTrend(c.v, p?.v),
    reservationsPct: computeTrend(c.r, p?.r),
    listingsPct: computeTrend(c.l, p?.l),
    soldPct: computeTrend(c.s, p?.s),
    dealsPct: computeTrend(c.d, p?.d),
    buyBoxPct: computeTrend(c.b, p?.b),
  };
}

export async function getMarketPulseForApi(): Promise<MarketPulseResponse> {
  const live = await computeLiveMarketMetrics();
  const prior = await prisma.platformMarketPulse.findFirst({
    where: { source: "platform" },
    orderBy: { createdAt: "desc" },
  });

  const trends = computeSnapshotTrends(live, prior);

  return {
    snapshot: {
      date: live.date.toISOString(),
      visitorsCount: live.visitorsCount,
      reservationsCount: live.reservationsCount,
      listingsCount: live.listingsCount,
      soldCount: live.soldCount,
      dealsDetected: live.dealsDetected,
      buyBoxMatches: live.buyBoxMatches,
      source: live.source,
      metadata: live.metadata,
    },
    trends,
    dataScopeLabel: MARKET_WATCH_PLATFORM_LABEL,
    scopeNote: MARKET_WATCH_DATA_SCOPE,
  };
}
