import { ListingStatus } from "@prisma/client";
import { UserEventType } from "@prisma/client";
import { prisma } from "@/lib/db";

const DAY = 24 * 60 * 60 * 1000;

export type GrowthFunnelCounts = {
  views: number;
  signups: number;
  inquiries: number;
  payments: number;
};

export type GrowthDashboardPayload = {
  totals: {
    users: number;
    leads: number;
    bookings: number;
    revenueCents90d: number;
  };
  funnel: GrowthFunnelCounts;
  rates: {
    signupRate: number | null;
    leadRate: number | null;
    paymentRate: number | null;
  };
  eventsByDay: { day: string; count: number }[];
};

function rate(num: number, den: number): number | null {
  if (den <= 0) return null;
  return Math.round((num / den) * 1000) / 10;
}

export async function getGrowthDashboardPayload(days = 14): Promise<GrowthDashboardPayload> {
  const since = new Date(Date.now() - days * DAY);
  const since90 = new Date(Date.now() - 90 * DAY);

  const [
    users,
    leads,
    bookings,
    revenue,
    views,
    signups,
    inquiries,
    payments,
    rawEvents,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.lead.count(),
    prisma.booking.count({ where: { status: { not: "PENDING" } } }),
    prisma.platformPayment.aggregate({
      where: { status: "paid", createdAt: { gte: since90 } },
      _sum: { amountCents: true },
    }),
    prisma.userEvent.count({
      where: { eventType: UserEventType.LISTING_VIEW, createdAt: { gte: since } },
    }),
    prisma.userEvent.count({
      where: { eventType: UserEventType.SIGNUP, createdAt: { gte: since } },
    }),
    prisma.userEvent.count({
      where: { eventType: UserEventType.INQUIRY, createdAt: { gte: since } },
    }),
    prisma.userEvent.count({
      where: { eventType: UserEventType.PAYMENT_SUCCESS, createdAt: { gte: since } },
    }),
    prisma.userEvent.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    }),
  ]);

  const dayMap = new Map<string, number>();
  for (const ev of rawEvents) {
    const d = ev.createdAt.toISOString().slice(0, 10);
    dayMap.set(d, (dayMap.get(d) ?? 0) + 1);
  }
  const eventsByDay = [...dayMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, count]) => ({ day, count }));

  const funnel: GrowthFunnelCounts = { views: views, signups, inquiries, payments };
  const published = await prisma.shortTermListing.count({ where: { listingStatus: ListingStatus.PUBLISHED } });

  return {
    totals: {
      users,
      leads,
      bookings,
      revenueCents90d: revenue._sum.amountCents ?? 0,
    },
    funnel,
    rates: {
      signupRate: rate(signups, Math.max(views, 1)),
      leadRate: rate(inquiries, Math.max(signups, 1)),
      paymentRate: rate(payments, Math.max(inquiries, 1)),
    },
    eventsByDay,
  };
}
