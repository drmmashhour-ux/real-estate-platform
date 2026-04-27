import { prisma } from "@/lib/db";

export type F1DailyClosingStats = {
  pendingCount: number;
  requestsCreatedToday: number;
  paymentsConfirmedToday: number;
  revenueSypToday: number;
};

/** Server-local “today” window for manual closing metrics (requests / payments / revenue). */
export async function getF1DailyClosingStats(): Promise<F1DailyClosingStats> {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const [pendingCount, requestsCreatedToday, confirmedAgg] = await Promise.all([
    prisma.syriaPaymentRequest.count({ where: { status: "pending" } }),
    prisma.syriaPaymentRequest.count({
      where: { createdAt: { gte: start, lt: end } },
    }),
    prisma.syriaPaymentRequest.aggregate({
      where: {
        status: "confirmed",
        confirmedAt: { gte: start, lt: end },
      },
      _count: { _all: true },
      _sum: { amount: true },
    }),
  ]);

  return {
    pendingCount,
    requestsCreatedToday,
    paymentsConfirmedToday: confirmedAgg._count._all,
    revenueSypToday: confirmedAgg._sum.amount ?? 0,
  };
}
