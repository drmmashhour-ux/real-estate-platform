/**
 * SYBNB-26 — Performance system: daily funnel, city discovery/conversion, listing leaderboard.
 * Uses SybnbEvent + SybnbBooking + SyriaProperty; excludes investor-demo listings (same rules as investor KPIs).
 */

import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { SYBNB_ANALYTICS_EVENT_TYPES } from "@/lib/sybnb/sybnb-analytics-events";
import { syriaPropertyExcludeInvestorDemoWhere } from "@/lib/sybnb/demo-metrics-filter";

function stayListingExcludeDemoWhere(): Prisma.SyriaPropertyWhereInput {
  return {
    category: "stay",
    AND: [syriaPropertyExcludeInvestorDemoWhere()],
  };
}

function sybnbEventListingNonDemoOrUnsetWhere(): Prisma.SybnbEventWhereInput {
  return {
    OR: [{ listingId: null }, { listing: syriaPropertyExcludeInvestorDemoWhere() }],
  };
}

function sybnbNonDemoActorWhere(): Prisma.SybnbEventWhereInput {
  return {
    OR: [
      { userId: null },
      {
        user: {
          NOT: [{ email: { startsWith: "DEMO_" } }, { email: { contains: "investor.sybnb.demo" } }],
        },
      },
    ],
  };
}

function sybnbBookingBaseWhere(extra?: Prisma.SybnbBookingWhereInput): Prisma.SybnbBookingWhereInput {
  const base: Prisma.SybnbBookingWhereInput = {
    listing: stayListingExcludeDemoWhere(),
  };
  if (!extra) return base;
  return { AND: [base, extra] };
}

export type SybnbPerformanceDailyRow = {
  dayKey: string;
  label: string;
  newStayListings: number;
  conversationsStarted: number;
  bookingRequests: number;
  successfulBookings: number;
};

/** UTC day buckets for ops review (SYBNB-26 §1 + §4). */
export async function getSybnbPerformanceDailySeries(locale: string, days = 14): Promise<SybnbPerformanceDailyRow[]> {
  const isAr = locale.toLowerCase().startsWith("ar");
  const out: SybnbPerformanceDailyRow[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const start = new Date();
    start.setUTCDate(start.getUTCDate() - i);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);

    const dayKey = start.toISOString().slice(0, 10);
    const label = start.toLocaleDateString(isAr ? "ar-SY" : "en-GB", {
      day: "numeric",
      month: "short",
    });

    const [newStayListings, conversationsStarted, bookingRequests, successfulBookings] = await Promise.all([
      prisma.syriaProperty.count({
        where: {
          ...stayListingExcludeDemoWhere(),
          createdAt: { gte: start, lt: end },
        },
      }),
      prisma.sybnbEvent.count({
        where: {
          type: {
            in: [SYBNB_ANALYTICS_EVENT_TYPES.CONTACT_CLICK, SYBNB_ANALYTICS_EVENT_TYPES.PHONE_REVEAL],
          },
          createdAt: { gte: start, lt: end },
          AND: [sybnbEventListingNonDemoOrUnsetWhere(), sybnbNonDemoActorWhere()],
        },
      }),
      prisma.sybnbEvent.count({
        where: {
          type: SYBNB_ANALYTICS_EVENT_TYPES.BOOKING_REQUEST,
          createdAt: { gte: start, lt: end },
          AND: [sybnbEventListingNonDemoOrUnsetWhere(), sybnbNonDemoActorWhere()],
        },
      }),
      prisma.sybnbBooking.count({
        where: sybnbBookingBaseWhere({
          status: "completed",
          updatedAt: { gte: start, lt: end },
        }),
      }),
    ]);

    out.push({
      dayKey,
      label,
      newStayListings,
      conversationsStarted,
      bookingRequests,
      successfulBookings,
    });
  }

  return out;
}

export type SybnbPerformanceCityRow = {
  city: string;
  listingViews: number;
  contactClicks: number;
  bookingRequests: number;
  conversionRequestsPerViewPct: number | null;
};

/** Merge keyed counts (same listing id): ORDER SYBNB-85 adds `phone_reveal` alongside contact taps for funnel aggregates. */
function mergeListingEventCounts(a: Map<string, number>, b: Map<string, number>): Map<string, number> {
  const out = new Map(a);
  for (const [k, v] of b) {
    out.set(k, (out.get(k) ?? 0) + v);
  }
  return out;
}

async function eventCountsByListing(
  type: typeof SYBNB_ANALYTICS_EVENT_TYPES[keyof typeof SYBNB_ANALYTICS_EVENT_TYPES],
  since: Date,
): Promise<Map<string, number>> {
  const grouped = await prisma.sybnbEvent.groupBy({
    by: ["listingId"],
    where: {
      type,
      listingId: { not: null },
      createdAt: { gte: since },
      AND: [sybnbEventListingNonDemoOrUnsetWhere(), sybnbNonDemoActorWhere()],
    },
    _count: { _all: true },
  });
  const m = new Map<string, number>();
  for (const row of grouped) {
    if (row.listingId) m.set(row.listingId, row._count._all);
  }
  return m;
}

/** Per-city discovery & funnel for the last `windowDays` days (SYBNB-26 §2). */
export async function getSybnbPerformanceCitySnapshot(windowDays = 30): Promise<SybnbPerformanceCityRow[]> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - windowDays);
  since.setUTCHours(0, 0, 0, 0);

  const [viewsByListing, contactsByListing, revealsByListing, requestsByListing] = await Promise.all([
    eventCountsByListing(SYBNB_ANALYTICS_EVENT_TYPES.LISTING_VIEW, since),
    eventCountsByListing(SYBNB_ANALYTICS_EVENT_TYPES.CONTACT_CLICK, since),
    eventCountsByListing(SYBNB_ANALYTICS_EVENT_TYPES.PHONE_REVEAL, since),
    eventCountsByListing(SYBNB_ANALYTICS_EVENT_TYPES.BOOKING_REQUEST, since),
  ]);

  const contactSignalsByListing = mergeListingEventCounts(contactsByListing, revealsByListing);

  const ids = new Set<string>();
  for (const k of viewsByListing.keys()) ids.add(k);
  for (const k of contactSignalsByListing.keys()) ids.add(k);
  for (const k of requestsByListing.keys()) ids.add(k);

  if (ids.size === 0) return [];

  const listings = await prisma.syriaProperty.findMany({
    where: {
      AND: [{ id: { in: [...ids] } }, stayListingExcludeDemoWhere()],
    },
    select: { id: true, city: true },
  });

  const listingCity = new Map(listings.map((p) => [p.id, p.city]));

  const agg: Record<string, { listingViews: number; contactClicks: number; bookingRequests: number }> = {};

  function addMap(map: Map<string, number>, field: "listingViews" | "contactClicks" | "bookingRequests") {
    for (const [listingId, n] of map) {
      const raw = listingCity.get(listingId);
      if (raw === undefined) continue;
      const ck = raw.trim() || "(unknown)";
      if (!agg[ck]) agg[ck] = { listingViews: 0, contactClicks: 0, bookingRequests: 0 };
      agg[ck][field] += n;
    }
  }

  addMap(viewsByListing, "listingViews");
  addMap(contactSignalsByListing, "contactClicks");
  addMap(requestsByListing, "bookingRequests");

  return Object.entries(agg).map(([city, v]) => ({
    city,
    listingViews: v.listingViews,
    contactClicks: v.contactClicks,
    bookingRequests: v.bookingRequests,
    conversionRequestsPerViewPct:
      v.listingViews === 0 ? null : Math.round((v.bookingRequests / v.listingViews) * 10000) / 100,
  }));
}

export type SybnbPerformanceListingRow = {
  listingId: string;
  titleAr: string;
  city: string;
  views: number;
  /** WhatsApp/tel `contact_click` taps (SYBNB-11). */
  messages: number;
  /** ORDER SYBNB-85 — masked “Show phone” taps (`phone_reveal`). */
  phoneReveals: number;
  bookingsCreated: number;
};

/** Top listings: ORDER SYBNB-85 — primary sort by phone reveals, then weighted engagement (SYBNB-26 §3). */
export async function getSybnbPerformanceListingLeaderboard(limit = 15): Promise<SybnbPerformanceListingRow[]> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 30);
  since.setUTCHours(0, 0, 0, 0);

  const [viewsByListing, contactsByListing, revealsByListing, bookingGroups] = await Promise.all([
    eventCountsByListing(SYBNB_ANALYTICS_EVENT_TYPES.LISTING_VIEW, since),
    eventCountsByListing(SYBNB_ANALYTICS_EVENT_TYPES.CONTACT_CLICK, since),
    eventCountsByListing(SYBNB_ANALYTICS_EVENT_TYPES.PHONE_REVEAL, since),
    prisma.sybnbBooking.groupBy({
      by: ["listingId"],
      where: sybnbBookingBaseWhere({
        createdAt: { gte: since },
      }),
      _count: { _all: true },
    }),
  ]);

  const bookingsByListing = new Map(bookingGroups.map((g) => [g.listingId, g._count._all]));

  const ids = new Set<string>();
  for (const k of viewsByListing.keys()) ids.add(k);
  for (const k of contactsByListing.keys()) ids.add(k);
  for (const k of revealsByListing.keys()) ids.add(k);
  for (const k of bookingsByListing.keys()) ids.add(k);

  if (ids.size === 0) return [];

  const listings = await prisma.syriaProperty.findMany({
    where: {
      AND: [{ id: { in: [...ids] } }, stayListingExcludeDemoWhere()],
    },
    select: { id: true, titleAr: true, city: true },
  });

  const meta = new Map(listings.map((p) => [p.id, p]));

  const scored: { listingId: string; score: number; phoneReveals: number }[] = [];
  for (const id of ids) {
    const v = viewsByListing.get(id) ?? 0;
    const c = contactsByListing.get(id) ?? 0;
    const pr = revealsByListing.get(id) ?? 0;
    const b = bookingsByListing.get(id) ?? 0;
    const score = v + (c + pr) * 3 + b * 10;
    scored.push({ listingId: id, score, phoneReveals: pr });
  }

  scored.sort((a, b) => b.phoneReveals - a.phoneReveals || b.score - a.score);

  return scored.slice(0, limit).map(({ listingId, phoneReveals }) => {
    const p = meta.get(listingId);
    return {
      listingId,
      titleAr: p?.titleAr ?? "—",
      city: p?.city?.trim() ? p.city : "(unknown)",
      views: viewsByListing.get(listingId) ?? 0,
      messages: contactsByListing.get(listingId) ?? 0,
      phoneReveals,
      bookingsCreated: bookingsByListing.get(listingId) ?? 0,
    };
  });
}
