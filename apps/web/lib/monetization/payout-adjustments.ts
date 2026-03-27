/**
 * Payout adjustments – refunds, dispute deductions, etc.
 */

import { prisma } from "@/lib/db";

export async function recordPayoutAdjustment(params: {
  bookingId?: string | null;
  adjustmentType: string;
  amountCents: number;
  currency?: string;
  reason?: string | null;
}) {
  return prisma.payoutAdjustment.create({
    data: {
      bookingId: params.bookingId ?? undefined,
      adjustmentType: params.adjustmentType,
      amountCents: params.amountCents,
      currency: params.currency ?? "USD",
      reason: params.reason ?? undefined,
      createdAt: new Date(),
    },
  });
}

export async function getPayoutAdjustmentsForBooking(bookingId: string) {
  return prisma.payoutAdjustment.findMany({
    where: { bookingId },
    orderBy: { createdAt: "desc" },
  });
}

export async function listPayoutAdjustments(params: {
  bookingId?: string;
  from?: Date;
  to?: Date;
  limit?: number;
}) {
  const where: Record<string, unknown> = {};
  if (params.bookingId) where.bookingId = params.bookingId;
  if (params.from || params.to) {
    where.createdAt = {};
    if (params.from) (where.createdAt as Record<string, Date>).gte = params.from;
    if (params.to) (where.createdAt as Record<string, Date>).lte = params.to;
  }
  return prisma.payoutAdjustment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: params.limit ?? 100,
  });
}
