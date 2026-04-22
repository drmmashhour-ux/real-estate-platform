import { prisma } from "@/lib/db";

/** Internal growth / launch KPIs — read-only aggregation for admin dashboards and validation. */
export async function getBrokerLaunchAnalytics() {
  const [invitePending, inviteAccepted, txEvents, revenueByUser, creditCompleted, distinctTxBrokers, activatedRows] =
    await Promise.all([
      prisma.lecipmBrokerInvite.count({ where: { status: "PENDING" } }),
      prisma.lecipmBrokerInvite.count({ where: { status: "ACCEPTED" } }),
      prisma.lecipmBrokerUsageEvent.count({ where: { type: "TRANSACTION" } }),
      prisma.lecipmBrokerUsageEvent.groupBy({
        by: ["userId"],
        where: {
          type: { in: ["TRANSACTION", "CONTRACT", "SIGNATURE", "CREDIT_CHECK", "LEAD"] },
          amount: { not: null },
        },
        _sum: { amount: true },
      }),
      prisma.lecipmTenantCreditCheck.count({ where: { status: "COMPLETED" } }),
      prisma.lecipmSdTransaction.findMany({
        select: { brokerId: true },
        distinct: ["brokerId"],
      }),
      prisma.lecipmBrokerUsageEvent.findMany({
        where: {
          type: { in: ["TRANSACTION", "CONTRACT", "SIGNATURE"] },
        },
        select: { userId: true },
        distinct: ["userId"],
      }),
    ]);

  const revenueTotal = revenueByUser.reduce((s, r) => s + (r._sum.amount ?? 0), 0);
  const brokersWithRevenue = revenueByUser.filter((r) => (r._sum.amount ?? 0) > 0).length;

  return {
    invites: { pending: invitePending, accepted: inviteAccepted },
    brokers: {
      distinctSdBrokers: distinctTxBrokers.length,
      activatedUsageBrokers: activatedRows.length,
      activationRateVsInvites:
        inviteAccepted > 0 ? activatedRows.length / inviteAccepted : inviteAccepted === 0 ? null : 0,
    },
    transactions: {
      usageEventsRecorded: txEvents,
    },
    revenue: {
      trackedBrokerRows: revenueByUser.length,
      brokersWithPositiveRevenue: brokersWithRevenue,
      totalAmountRecorded: Math.round(revenueTotal * 100) / 100,
      avgPerBrokerWithRevenue:
        brokersWithRevenue > 0 ? Math.round((revenueTotal / brokersWithRevenue) * 100) / 100 : 0,
    },
    creditChecks: {
      completed: creditCompleted,
    },
  };
}
