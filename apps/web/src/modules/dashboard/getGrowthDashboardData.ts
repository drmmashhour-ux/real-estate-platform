import { prisma } from "@/lib/db";
import { getEventsOverTime, getFunnelCounts, conversionRates } from "@/src/modules/analytics/funnel";

const DAY_30 = 30 * 24 * 60 * 60 * 1000;

export async function getGrowthDashboardData() {
  const since = new Date(Date.now() - DAY_30);

  const [users, leads, bookings, revenue, funnel, series] = await Promise.all([
    prisma.user.count(),
    prisma.lead.count(),
    prisma.booking.count(),
    prisma.platformPayment.aggregate({
      where: { status: "paid", createdAt: { gte: since } },
      _sum: { amountCents: true },
    }),
    getFunnelCounts(since),
    getEventsOverTime(since, 1),
  ]);

  const rates = conversionRates(funnel);

  return {
    totals: {
      users,
      leads,
      bookings,
      revenueCents30d: revenue._sum.amountCents ?? 0,
    },
    funnel,
    rates,
    series,
    since: since.toISOString(),
  };
}
