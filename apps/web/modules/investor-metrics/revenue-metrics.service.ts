import { prisma } from "@/lib/db";
import { subDays } from "date-fns";

/** Stripe/platform fee rows when present — falls back to revenue events only. */
export async function buildRevenueMetricsSnapshot(now = new Date()) {
  const since90 = subDays(now, 90);

  const [revenueEvents90, platformCommissions90] = await Promise.all([
    prisma.revenueEvent.aggregate({
      where: { createdAt: { gte: since90, lte: now } },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.platformCommissionRecord.aggregate({
      where: { createdAt: { gte: since90, lte: now } },
      _sum: { platformShareCents: true },
      _count: { _all: true },
    }),
  ]);

  return {
    generatedAt: now.toISOString(),
    revenueEventsSum90d: revenueEvents90._sum.amount ?? 0,
    revenueEventCount90d: revenueEvents90._count._all,
    platformCommissionCents90d: platformCommissions90._sum.platformShareCents ?? 0,
    platformCommissionRows90d: platformCommissions90._count._all,
    disclaimers: [
      "Revenue recognition policy belongs to finance; this is raw event sums for internal dashboards.",
    ],
  };
}
