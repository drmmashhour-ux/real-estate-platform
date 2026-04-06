import { prisma } from "@/lib/db";
import type { PaymentMetricsSlice } from "./types";

export async function collectPaymentMetrics(start: Date, end: Date): Promise<PaymentMetricsSlice> {
  const [paymentsCreated, byStatusRows, withCheckout, failed, completed, webhookRows, webhookGroups, recentFailed] =
    await Promise.all([
      prisma.payment.count({ where: { createdAt: { gte: start, lte: end } } }),
      prisma.payment.groupBy({
        by: ["status"],
        where: { createdAt: { gte: start, lte: end } },
        _count: { _all: true },
      }),
      prisma.payment.count({
        where: { createdAt: { gte: start, lte: end }, stripeCheckoutSessionId: { not: null } },
      }),
      prisma.payment.count({
        where: { createdAt: { gte: start, lte: end }, status: "FAILED" },
      }),
      prisma.payment.count({
        where: { createdAt: { gte: start, lte: end }, status: "COMPLETED" },
      }),
      prisma.growthStripeWebhookLog.count({ where: { createdAt: { gte: start, lte: end } } }),
      prisma.growthStripeWebhookLog.groupBy({
        by: ["eventType"],
        where: { createdAt: { gte: start, lte: end } },
        _count: { _all: true },
      }),
      prisma.payment.findMany({
        where: { createdAt: { gte: start, lte: end }, status: "FAILED" },
        select: { id: true, status: true, bookingId: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 15,
      }),
    ]);

  const byStatus: Record<string, number> = {};
  for (const row of byStatusRows) {
    byStatus[row.status] = row._count._all;
  }
  const webhookByType: Record<string, number> = {};
  for (const row of webhookGroups) {
    webhookByType[row.eventType] = row._count._all;
  }

  return {
    paymentsCreated,
    byStatus,
    withCheckoutSession: withCheckout,
    failed,
    completed,
    webhookEvents: webhookRows,
    webhookByType,
    recentFailed: recentFailed.map((p) => ({
      id: p.id,
      status: p.status,
      bookingId: p.bookingId,
      createdAt: p.createdAt.toISOString(),
    })),
  };
}
