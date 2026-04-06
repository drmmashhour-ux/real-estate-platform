import { prisma } from "@/lib/db";
import type { BookingMetricsSlice } from "./types";

export async function collectBookingMetrics(start: Date, end: Date): Promise<BookingMetricsSlice> {
  const [createdInRange, byStatusRows, awaitingHostApproval, pendingManualSettlement, cancelledInRange, manualTrackedBookings] =
    await Promise.all([
      prisma.booking.count({ where: { createdAt: { gte: start, lte: end } } }),
      prisma.booking.groupBy({
        by: ["status"],
        where: { createdAt: { gte: start, lte: end } },
        _count: { _all: true },
      }),
      prisma.booking.count({ where: { status: "AWAITING_HOST_APPROVAL" } }),
      prisma.booking.count({
        where: {
          manualPaymentSettlement: "PENDING",
          status: { in: ["PENDING", "CONFIRMED"] },
        },
      }),
      prisma.booking.count({
        where: {
          createdAt: { gte: start, lte: end },
          status: { in: ["CANCELLED", "CANCELLED_BY_GUEST", "CANCELLED_BY_HOST"] },
        },
      }),
      prisma.booking.count({
        where: {
          createdAt: { gte: start, lte: end },
          manualPaymentSettlement: { not: "NOT_APPLICABLE" },
        },
      }),
    ]);

  const byStatus: Record<string, number> = {};
  for (const row of byStatusRows) {
    byStatus[row.status] = row._count._all;
  }

  const stripeRows = await prisma.payment.count({
    where: {
      createdAt: { gte: start, lte: end },
      stripeCheckoutSessionId: { not: null },
    },
  });

  const attention = await prisma.booking.findMany({
    where: {
      OR: [
        { status: "AWAITING_HOST_APPROVAL" },
        { status: "PENDING", manualPaymentSettlement: "PENDING" },
      ],
    },
    select: {
      id: true,
      status: true,
      manualPaymentSettlement: true,
      checkIn: true,
      createdAt: true,
      listingId: true,
    },
    orderBy: { createdAt: "desc" },
    take: 25,
  });

  return {
    createdInRange,
    byStatus,
    awaitingHostApproval,
    pendingManualSettlement,
    cancelledInRange,
    onlineStripeCheckoutPayments: stripeRows,
    manualTrackedBookings,
    attentionBookings: attention.map((b) => ({
      id: b.id,
      status: b.status,
      manualPaymentSettlement: b.manualPaymentSettlement,
      checkIn: b.checkIn.toISOString(),
      createdAt: b.createdAt.toISOString(),
      listingId: b.listingId,
    })),
  };
}
