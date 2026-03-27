/**
 * Payout hold audit and state.
 * When we hold a payout (fraud, dispute, safety), we create a PayoutHold record.
 * When we release, we update status to RELEASED and set releasedAt.
 */

import { prisma } from "@/lib/db";
import type { PayoutHoldStatus } from "@prisma/client";
import type { PayoutHoldReason } from "./constants";

const REASON_TO_DB = (r: string): string => r;

/** Create a payout hold record for a booking (audit + state). */
export async function createPayoutHold(params: {
  bookingId: string;
  hostId: string;
  reason: PayoutHoldReason | string;
}): Promise<string> {
  const hold = await prisma.payoutHold.create({
    data: {
      bookingId: params.bookingId,
      hostId: params.hostId,
      reason: REASON_TO_DB(params.reason),
      status: "ON_HOLD",
    },
  });
  return hold.id;
}

/** Release a hold (set status RELEASED and releasedAt). */
export async function releasePayoutHold(holdId: string): Promise<void> {
  await prisma.payoutHold.update({
    where: { id: holdId },
    data: { status: "RELEASED", releasedAt: new Date() },
  });
}

/** Release all ON_HOLD holds for a booking (e.g. after dispute resolved). */
export async function releasePayoutHoldsForBooking(bookingId: string): Promise<number> {
  const result = await prisma.payoutHold.updateMany({
    where: { bookingId, status: "ON_HOLD" },
    data: { status: "RELEASED", releasedAt: new Date() },
  });
  return result.count;
}

/** Mark hold as REFUNDED when refund is issued. */
export async function markHoldRefunded(holdId: string): Promise<void> {
  await prisma.payoutHold.update({
    where: { id: holdId },
    data: { status: "REFUNDED", releasedAt: new Date() },
  });
}

/** Mark all ON_HOLD holds for a booking as REFUNDED. */
export async function markHoldsRefundedForBooking(bookingId: string): Promise<number> {
  const holds = await prisma.payoutHold.findMany({
    where: { bookingId, status: "ON_HOLD" },
    select: { id: true },
  });
  const now = new Date();
  for (const h of holds) {
    await prisma.payoutHold.update({
      where: { id: h.id },
      data: { status: "REFUNDED", releasedAt: now },
    });
  }
  return holds.length;
}

/** Get active holds for a host. */
export async function getActiveHoldsForHost(hostId: string) {
  return prisma.payoutHold.findMany({
    where: { hostId, status: "ON_HOLD" },
    include: { booking: { select: { id: true, checkIn: true, listingId: true } } },
    orderBy: { createdAt: "desc" },
  });
}

/** Get holds for a booking. */
export async function getHoldsForBooking(bookingId: string) {
  return prisma.payoutHold.findMany({
    where: { bookingId },
    orderBy: { createdAt: "desc" },
  });
}
