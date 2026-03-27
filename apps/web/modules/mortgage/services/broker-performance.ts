import { prisma } from "@/lib/db";

/** Recompute `rating` and `totalReviews` from all reviews for a broker. */
export async function refreshBrokerRatingAggregates(brokerId: string): Promise<void> {
  const agg = await prisma.brokerReview.aggregate({
    where: { brokerId },
    _avg: { rating: true },
    _count: { _all: true },
  });
  await prisma.mortgageBroker.update({
    where: { id: brokerId },
    data: {
      rating: agg._avg.rating ?? 0,
      totalReviews: agg._count._all,
    },
  });
}

/**
 * First time broker moves lead from pending → contacted or approved:
 * record response time (hours from assignment) and increment leads handled.
 */
export async function applyMortgageRequestPerformanceStats(params: {
  requestId: string;
  brokerId: string;
  previousStatus: string;
  nextStatus: string;
  assignedAt: Date | null;
  alreadyRecorded: boolean;
}): Promise<void> {
  const { requestId, brokerId, previousStatus, nextStatus, assignedAt, alreadyRecorded } = params;
  if (alreadyRecorded) return;
  if (previousStatus !== "pending") return;
  if (nextStatus !== "contacted" && nextStatus !== "approved") return;
  if (!assignedAt) return;

  const hours = Math.max(0, (Date.now() - assignedAt.getTime()) / 3_600_000);

  const broker = await prisma.mortgageBroker.findUnique({
    where: { id: brokerId },
    select: {
      responseTimeAvg: true,
      responseTimeSamples: true,
      totalLeadsHandled: true,
    },
  });
  if (!broker) return;

  const n = broker.responseTimeSamples;
  const nextAvg =
    n === 0 ? hours : ((broker.responseTimeAvg ?? 0) * n + hours) / (n + 1);

  await prisma.$transaction([
    prisma.mortgageBroker.update({
      where: { id: brokerId },
      data: {
        responseTimeAvg: nextAvg,
        responseTimeSamples: n + 1,
        totalLeadsHandled: broker.totalLeadsHandled + 1,
      },
    }),
    prisma.mortgageRequest.update({
      where: { id: requestId },
      data: { performanceStatsRecorded: true },
    }),
  ]);
}
