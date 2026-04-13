import { BookingStatus, ListingAuthorityType, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

/**
 * Platform listing split (no `createdByRole` on CRM Listing):
 * - Broker: CRM listings created that day with any broker_listing_access, plus BNHUB stays with listingAuthorityType = BROKER.
 * - Self: FSBO (non-DRAFT) created that day, plus short-term listings with OWNER or unset authority (host / self-serve).
 */
export type PlatformDailyPoint = {
  date: string;
  visitors: number;
  listingsBroker: number;
  listingsSelf: number;
  transactionsClosed: number;
};

export type PlatformStatsResult = {
  series: PlatformDailyPoint[];
  totals: {
    visitors: number;
    listingsBroker: number;
    listingsSelf: number;
    transactionsClosed: number;
    listingsTotal: number;
  };
};

function utcDayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function startOfUtcDay(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function addUtcDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

async function countListingsBrokerDay(start: Date, end: Date): Promise<number> {
  const [crm, st] = await Promise.all([
    prisma.listing.count({
      where: {
        createdAt: { gte: start, lt: end },
        brokerAccesses: { some: {} },
      },
    }),
    prisma.shortTermListing.count({
      where: {
        createdAt: { gte: start, lt: end },
        listingAuthorityType: ListingAuthorityType.BROKER,
      },
    }),
  ]);
  return crm + st;
}

async function countListingsSelfDay(start: Date, end: Date): Promise<number> {
  const [fsbo, st] = await Promise.all([
    prisma.fsboListing.count({
      where: {
        createdAt: { gte: start, lt: end },
        NOT: { status: "DRAFT" },
      },
    }),
    prisma.shortTermListing.count({
      where: {
        createdAt: { gte: start, lt: end },
        OR: [{ listingAuthorityType: ListingAuthorityType.OWNER }, { listingAuthorityType: null }],
      },
    }),
  ]);
  return fsbo + st;
}

/** Deduped booking ids: CONFIRMED (updated that day) ∪ Payment COMPLETED (updated that day). */
async function countTransactionsClosedDay(start: Date, end: Date): Promise<number> {
  const [confirmedBookings, completedPayments] = await Promise.all([
    prisma.booking.findMany({
      where: {
        status: BookingStatus.CONFIRMED,
        updatedAt: { gte: start, lt: end },
      },
      select: { id: true },
    }),
    prisma.payment.findMany({
      where: {
        status: PaymentStatus.COMPLETED,
        updatedAt: { gte: start, lt: end },
      },
      select: { bookingId: true },
    }),
  ]);
  const ids = new Set<string>();
  for (const b of confirmedBookings) ids.add(b.id);
  for (const p of completedPayments) ids.add(p.bookingId);
  return ids.size;
}

export async function getPlatformStats(days: 1 | 7 | 14 | 30): Promise<PlatformStatsResult> {
  const now = new Date();
  const todayStart = startOfUtcDay(now);
  const rangeStart = addUtcDays(todayStart, -(days - 1));
  const rangeEndExclusive = addUtcDays(todayStart, 1);

  const analyticsRows = await prisma.platformAnalytics.findMany({
    where: {
      date: { gte: rangeStart, lt: rangeEndExclusive },
    },
  });

  const visitorsByDay = new Map<string, number>();
  for (const row of analyticsRows) {
    visitorsByDay.set(utcDayKey(row.date), row.visitors);
  }

  const dayRanges = Array.from({ length: days }, (_, i) => {
    const dayStart = addUtcDays(rangeStart, i);
    const dayEnd = addUtcDays(dayStart, 1);
    return { dayStart, dayEnd, key: utcDayKey(dayStart) };
  });

  const perDayMetrics = await Promise.all(
    dayRanges.map(async ({ dayStart, dayEnd, key }) => {
      const [b, s, tx] = await Promise.all([
        countListingsBrokerDay(dayStart, dayEnd),
        countListingsSelfDay(dayStart, dayEnd),
        countTransactionsClosedDay(dayStart, dayEnd),
      ]);
      const v = visitorsByDay.get(key) ?? 0;
      return { key, v, b, s, tx };
    })
  );

  let visitors = 0;
  let listingsBroker = 0;
  let listingsSelf = 0;
  let transactionsClosed = 0;

  const series: PlatformDailyPoint[] = perDayMetrics.map(({ key, v, b, s, tx }) => {
    visitors += v;
    listingsBroker += b;
    listingsSelf += s;
    transactionsClosed += tx;
    return {
      date: key,
      visitors: v,
      listingsBroker: b,
      listingsSelf: s,
      transactionsClosed: tx,
    };
  });

  return {
    series,
    totals: {
      visitors,
      listingsBroker,
      listingsSelf,
      transactionsClosed,
      listingsTotal: listingsBroker + listingsSelf,
    },
  };
}
