/**
 * Executive Business Metrics – GMV, net revenue, MRR/ARR, bookings by market, growth funnel.
 * Aggregates cross-module data for leadership dashboards.
 */
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { getRevenueSummary } from "@/lib/revenue-intelligence";

/** Build and optionally persist executive metrics snapshot for a date (and optional market). */
export async function buildExecutiveSnapshot(params: {
  date: Date;
  marketId?: string;
  persist?: boolean;
}) {
  const start = new Date(params.date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const [
    bookingsCount,
    payments,
    disputesCount,
    refundsCount,
    revenueSummary,
    activeHostsCount,
  ] = await Promise.all([
    prisma.booking.count({
      where: { createdAt: { gte: start, lt: end } },
    }),
    prisma.payment.findMany({
      where: {
        createdAt: { gte: start, lt: end },
        status: "COMPLETED",
      },
      select: { amountCents: true, bookingId: true },
    }),
    prisma.dispute.count({
      where: { createdAt: { gte: start, lt: end } },
    }),
    prisma.payment.count({
      where: { status: "REFUNDED", updatedAt: { gte: start, lt: end } },
    }),
    getRevenueSummary({
      periodStart: start,
      periodEnd: end,
      marketId: params.marketId,
    }),
    prisma.shortTermListing.findMany({
      where: { createdAt: { lt: end } },
      select: { ownerId: true },
      distinct: ["ownerId"],
    }).then((r) => r.length),
  ]);

  const gmvCents = payments.reduce((s, p) => s + p.amountCents, 0);
  const netRevenueCents = revenueSummary.totalCents;
  const totalPayments = payments.length;
  const refundRate = totalPayments > 0 ? refundsCount / totalPayments : 0;
  const disputeRate = bookingsCount > 0 ? disputesCount / bookingsCount : 0;

  const subscriptions = await prisma.planSubscription.findMany({
    where: {
      status: { in: ["ACTIVE", "TRIALING"] },
      currentPeriodEnd: { gte: end },
      currentPeriodStart: { lte: start },
    },
    include: { plan: { select: { amountCents: true, billingCycle: true } } },
  });
  let mrrCents = 0;
  for (const s of subscriptions) {
    mrrCents += s.plan.billingCycle === "YEARLY" ? Math.round(s.plan.amountCents / 12) : s.plan.amountCents;
  }
  const arrCents = mrrCents * 12;

  const activeBrokersCount = 0;

  const snapshot = {
    date: start,
    marketId: params.marketId,
    gmvCents,
    netRevenueCents,
    bookingsCount,
    activeHostsCount,
    activeBrokersCount,
    mrrCents,
    arrCents,
    refundRate,
    disputeRate,
    data: {
      revenueByType: revenueSummary.byType,
      disputesCount,
      refundsCount,
    },
  };

  if (params.persist) {
    const marketKey = params.marketId ?? "__GLOBAL__";
    const existing = await prisma.executiveMetricsSnapshot.findFirst({
      where: { date: start, marketId: marketKey },
    });
    const payload = {
      gmvCents: snapshot.gmvCents,
      netRevenueCents: snapshot.netRevenueCents,
      bookingsCount: snapshot.bookingsCount,
      activeHostsCount: snapshot.activeHostsCount,
      activeBrokersCount: snapshot.activeBrokersCount,
      mrrCents: snapshot.mrrCents,
      arrCents: snapshot.arrCents,
      refundRate: snapshot.refundRate,
      disputeRate: snapshot.disputeRate,
      data: snapshot.data as object,
    };
    if (existing) {
      await prisma.executiveMetricsSnapshot.update({
        where: { id: existing.id },
        data: payload,
      });
    } else {
      await prisma.executiveMetricsSnapshot.create({
        data: {
          date: start,
          marketId: marketKey,
          ...payload,
        },
      });
    }
  }

  return snapshot;
}

/** Get stored executive snapshots. */
export async function getExecutiveSnapshots(params: {
  marketId?: string;
  from?: Date;
  to?: Date;
  limit?: number;
}) {
  const where: Prisma.ExecutiveMetricsSnapshotWhereInput = {};
  if (params.marketId) where.marketId = params.marketId;
  if (params.from || params.to) {
    where.date = {};
    if (params.from) where.date.gte = params.from;
    if (params.to) where.date.lte = params.to;
  }
  return prisma.executiveMetricsSnapshot.findMany({
    where,
    orderBy: { date: "desc" },
    take: params.limit ?? 90,
  });
}
