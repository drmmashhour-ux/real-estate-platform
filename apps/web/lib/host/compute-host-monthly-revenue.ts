import { PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export type HostMonthlyRevenue = {
  monthStart: string;
  monthEnd: string;
  /** Sum of host payout cents for COMPLETED payments tied to host listings, payment updated in range */
  revenueCentsFromPayments: number;
  bookingCount: number;
};

/**
 * Calendar-month rollup in UTC (dashboard metric; not tax advice).
 */
export async function computeHostMonthlyRevenueCents(
  hostUserId: string,
  ref: Date = new Date()
): Promise<HostMonthlyRevenue> {
  const y = ref.getUTCFullYear();
  const m = ref.getUTCMonth();
  const monthStart = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
  const monthEnd = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999));

  const listingIds = await prisma.shortTermListing.findMany({
    where: { ownerId: hostUserId },
    select: { id: true },
  });
  const ids = listingIds.map((l) => l.id);
  if (ids.length === 0) {
    return {
      monthStart: monthStart.toISOString(),
      monthEnd: monthEnd.toISOString(),
      revenueCentsFromPayments: 0,
      bookingCount: 0,
    };
  }

  const payments = await prisma.payment.findMany({
    where: {
      status: PaymentStatus.COMPLETED,
      updatedAt: { gte: monthStart, lte: monthEnd },
      booking: { listingId: { in: ids } },
    },
    select: { hostPayoutCents: true, bookingId: true },
  });

  const revenueCentsFromPayments = payments.reduce((s, p) => s + (p.hostPayoutCents ?? 0), 0);
  const bookingCount = new Set(payments.map((p) => p.bookingId)).size;

  return {
    monthStart: monthStart.toISOString(),
    monthEnd: monthEnd.toISOString(),
    revenueCentsFromPayments,
    bookingCount,
  };
}
