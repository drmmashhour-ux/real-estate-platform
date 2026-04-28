import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { SYBNB_ANALYTICS_EVENT_TYPES } from "@/lib/sybnb/sybnb-analytics-events";
import { syriaPropertyExcludeInvestorDemoWhere } from "@/lib/sybnb/demo-metrics-filter";

/** Published SYBNB stays eligible for the public catalog (non-demo). */
export function sybnbInvestorMetricsListingWhere() {
  return {
    category: "stay" as const,
    status: "PUBLISHED" as const,
    sybnbReview: "APPROVED" as const,
    AND: [syriaPropertyExcludeInvestorDemoWhere()],
  };
}

function sybnbEventListingNonDemoOrUnsetWhere(): Prisma.SybnbEventWhereInput {
  return {
    OR: [{ listingId: null }, { listing: syriaPropertyExcludeInvestorDemoWhere() }],
  };
}

function sybnbNonDemoUserWhere(): Prisma.SybnbEventWhereInput {
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

export type InvestorDayPoint = { dayKey: string; label: string; views: number; bookingRequests: number };

export async function getSybnbInvestorKpis() {
  const listingWhere = sybnbInvestorMetricsListingWhere();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);

  const [
    totalListings,
    bookingRowsTotal,
    listingViewsEvents,
    bookingRequestEvents,
    activeUsers30d,
  ] = await Promise.all([
    prisma.syriaProperty.count({ where: listingWhere }),
    prisma.sybnbBooking.count({
      where: { listing: listingWhere },
    }),
    prisma.sybnbEvent.count({
      where: {
        type: SYBNB_ANALYTICS_EVENT_TYPES.LISTING_VIEW,
        AND: [sybnbEventListingNonDemoOrUnsetWhere()],
      },
    }),
    prisma.sybnbEvent.count({
      where: {
        type: SYBNB_ANALYTICS_EVENT_TYPES.BOOKING_REQUEST,
        AND: [sybnbEventListingNonDemoOrUnsetWhere()],
      },
    }),
    prisma.sybnbEvent.groupBy({
      by: ["userId"],
      where: {
        userId: { not: null },
        createdAt: { gte: thirtyDaysAgo },
        AND: [sybnbNonDemoUserWhere()],
      },
      _count: { _all: true },
    }),
  ]);

  const conversionPct =
    listingViewsEvents === 0
      ? null
      : Math.round((bookingRowsTotal / listingViewsEvents) * 10000) / 100;

  return {
    totalListings,
    bookingRequestsRows: bookingRowsTotal,
    listingViewsTracked: listingViewsEvents,
    bookingRequestEvents,
    activeUsers30d: activeUsers30d.length,
    conversionBookingRowsPerViewPct: conversionPct,
  };
}

export async function getSybnbInvestorGrowthTrend(locale: string, days = 14): Promise<InvestorDayPoint[]> {
  const isAr = locale.toLowerCase().startsWith("ar");
  const out: InvestorDayPoint[] = [];

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

    const [views, bookingRequests] = await Promise.all([
      prisma.sybnbEvent.count({
        where: {
          type: SYBNB_ANALYTICS_EVENT_TYPES.LISTING_VIEW,
          createdAt: { gte: start, lt: end },
          AND: [sybnbEventListingNonDemoOrUnsetWhere()],
        },
      }),
      prisma.sybnbEvent.count({
        where: {
          type: SYBNB_ANALYTICS_EVENT_TYPES.BOOKING_REQUEST,
          createdAt: { gte: start, lt: end },
          AND: [sybnbEventListingNonDemoOrUnsetWhere()],
        },
      }),
    ]);

    out.push({ dayKey, label, views, bookingRequests });
  }

  return out;
}

export async function getSybnbInvestorTopCities(limit = 8) {
  const grouped = await prisma.syriaProperty.groupBy({
    by: ["city"],
    where: sybnbInvestorMetricsListingWhere(),
    _count: { _all: true },
  });

  return grouped
    .filter((g) => g.city.trim().length > 0)
    .sort((a, b) => b._count._all - a._count._all)
    .slice(0, limit)
    .map((g) => ({ city: g.city, count: g._count._all }));
}

export async function getSybnbInvestorActivityLast7Days() {
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - 7);
  start.setUTCHours(0, 0, 0, 0);

  const eventWhere: Prisma.SybnbEventWhereInput = {
    createdAt: { gte: start },
    AND: [sybnbEventListingNonDemoOrUnsetWhere(), sybnbNonDemoUserWhere()],
  };

  const [listingViews, contactClicks, bookingRequests, reportsSubmitted] = await Promise.all([
    prisma.sybnbEvent.count({
      where: { type: SYBNB_ANALYTICS_EVENT_TYPES.LISTING_VIEW, ...eventWhere },
    }),
    prisma.sybnbEvent.count({
      where: {
        type: { in: [SYBNB_ANALYTICS_EVENT_TYPES.CONTACT_CLICK, SYBNB_ANALYTICS_EVENT_TYPES.PHONE_REVEAL] },
        ...eventWhere,
      },
    }),
    prisma.sybnbEvent.count({
      where: { type: SYBNB_ANALYTICS_EVENT_TYPES.BOOKING_REQUEST, ...eventWhere },
    }),
    prisma.sybnbEvent.count({
      where: { type: SYBNB_ANALYTICS_EVENT_TYPES.REPORT_SUBMITTED, ...eventWhere },
    }),
  ]);

  return {
    listingViews,
    contactClicks,
    bookingRequests,
    reportsSubmitted,
  };
}

export async function getSybnbInvestorDemoListingId(): Promise<string | null> {
  const row = await prisma.syriaProperty.findFirst({
    where: sybnbInvestorMetricsListingWhere(),
    select: { id: true },
    orderBy: [{ sy8FeedRankScore: "desc" }, { updatedAt: "desc" }],
  });
  return row?.id ?? null;
}
