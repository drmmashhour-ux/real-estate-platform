import { prisma } from "@/lib/db";
import { getPlatformStats } from "@/modules/analytics/services/get-platform-stats";
import { isInvestorMetricsDemoMode } from "@/lib/investor/env";

export type InvestorKpis = {
  totalListings: number;
  activeListings: number;
  totalUsers: number;
  totalTransactions: number;
  totalRevenueCents: number;
};

export type TimeSeriesPoint = { date: string; value: number };

export type InvestorMetricsPayload = {
  kpis: InvestorKpis;
  listingsGrowth: TimeSeriesPoint[];
  transactionsOverTime: TimeSeriesPoint[];
  usersGrowth: TimeSeriesPoint[];
  revenueOverTime: TimeSeriesPoint[];
  demoMode: boolean;
};

function utcDayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function startOfUtcDay(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function addUtcDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

function withDemoJitter(points: TimeSeriesPoint[], seed: number): TimeSeriesPoint[] {
  if (!isInvestorMetricsDemoMode()) return points;
  return points.map((p, i) => ({
    date: p.date,
    value: Math.max(0, Math.round(p.value + Math.sin(seed + i * 1.7) * 3 + (p.value === 0 ? 2 + i : 0))),
  }));
}

export async function getInvestorMetrics(days: 30 | 7 | 14 = 30): Promise<InvestorMetricsPayload> {
  const [
    fsboTotal,
    fsboActive,
    stTotal,
    stActive,
    crmTotal,
    userCount,
    offersCount,
    dealsCount,
    bookingsConfirmed,
    revenueAgg,
  ] = await Promise.all([
    prisma.fsboListing.count(),
    prisma.fsboListing.count({ where: { status: "ACTIVE", moderationStatus: "APPROVED" } }),
    prisma.shortTermListing.count(),
    prisma.shortTermListing.count({ where: { listingStatus: "PUBLISHED" } }),
    prisma.listing.count(),
    prisma.user.count(),
    prisma.offer.count({ where: { status: "SUBMITTED" } }),
    prisma.deal.count(),
    prisma.booking.count({ where: { status: "CONFIRMED" } }),
    prisma.platformRevenueEvent.aggregate({
      where: { status: "realized" },
      _sum: { amountCents: true },
    }),
  ]);

  /** CRM `Listing` has no status column — use total count for both total and “active” KPIs. */
  const crmActive = crmTotal;

  const totalListings = fsboTotal + stTotal + crmTotal;
  const activeListings = fsboActive + stActive + crmActive;
  const totalTransactions = offersCount + dealsCount + bookingsConfirmed;

  const platform = await getPlatformStats(days === 7 ? 7 : days === 14 ? 14 : 30);

  const listingsGrowth: TimeSeriesPoint[] = platform.series.map((row) => ({
    date: row.date,
    value: row.listingsBroker + row.listingsSelf,
  }));

  const transactionsOverTime: TimeSeriesPoint[] = platform.series.map((row) => ({
    date: row.date,
    value: row.transactionsClosed,
  }));

  const now = new Date();
  const todayStart = startOfUtcDay(now);
  const rangeStart = addUtcDays(todayStart, -(days - 1));
  const rangeEnd = addUtcDays(todayStart, 1);

  const newUsers = await prisma.user.findMany({
    where: { createdAt: { gte: rangeStart, lt: rangeEnd } },
    select: { createdAt: true },
  });
  const userBucket = new Map<string, number>();
  for (const u of newUsers) {
    const k = utcDayKey(u.createdAt);
    userBucket.set(k, (userBucket.get(k) ?? 0) + 1);
  }

  const usersGrowth: TimeSeriesPoint[] = [];
  for (let i = 0; i < days; i++) {
    const day = addUtcDays(rangeStart, i);
    const key = utcDayKey(day);
    usersGrowth.push({ date: key, value: userBucket.get(key) ?? 0 });
  }

  const revRows = await prisma.platformRevenueEvent.findMany({
    where: { createdAt: { gte: rangeStart, lt: rangeEnd }, status: "realized" },
    select: { createdAt: true, amountCents: true },
  });
  const revBucket = new Map<string, number>();
  for (const r of revRows) {
    const k = utcDayKey(r.createdAt);
    revBucket.set(k, (revBucket.get(k) ?? 0) + r.amountCents);
  }

  const revenueOverTime: TimeSeriesPoint[] = [];
  for (let i = 0; i < days; i++) {
    const day = addUtcDays(rangeStart, i);
    const key = utcDayKey(day);
    const cents = revBucket.get(key) ?? 0;
    revenueOverTime.push({ date: key, value: Math.round(cents / 100) });
  }

  const kpis: InvestorKpis = {
    totalListings,
    activeListings,
    totalUsers: userCount,
    totalTransactions,
    totalRevenueCents: revenueAgg._sum.amountCents ?? 0,
  };

  const demoMode = isInvestorMetricsDemoMode();

  return {
    kpis,
    listingsGrowth: withDemoJitter(listingsGrowth, 1),
    transactionsOverTime: withDemoJitter(transactionsOverTime, 2),
    usersGrowth: withDemoJitter(usersGrowth, 3),
    revenueOverTime: withDemoJitter(revenueOverTime, 4),
    demoMode,
  };
}
