/**
 * BNHUB stay availability: date overlap + stale unpaid pending expiration.
 * Listing model in DB is `ShortTermListing`; overlap targets `Booking` rows.
 */

import type { Prisma } from "@prisma/client";
import { logInfo } from "@/lib/logger";

/** Standard interval overlap: [checkIn, checkOut) vs existing [in, out). */
export function bnhubDateRangesOverlap(
  checkIn: Date,
  checkOut: Date,
  existingCheckIn: Date,
  existingCheckOut: Date
): boolean {
  return checkIn < existingCheckOut && checkOut > existingCheckIn;
}

const PENDING_HOLD_MS = 60 * 60 * 1000;

/**
 * Marks abandoned unpaid checkouts as EXPIRED so they no longer block inventory.
 */
export async function expireStaleBnhubPendingBookings(
  tx: Prisma.TransactionClient,
  listingId: string
): Promise<number> {
  const now = new Date();
  const legacyCutoff = new Date(now.getTime() - PENDING_HOLD_MS);
  const res = await tx.booking.updateMany({
    where: {
      listingId,
      status: "PENDING",
      payment: { status: "PENDING" },
      OR: [
        { pendingCheckoutExpiresAt: { lt: now } },
        {
          AND: [{ pendingCheckoutExpiresAt: null }, { createdAt: { lt: legacyCutoff } }],
        },
      ],
    },
    data: { status: "EXPIRED" },
  });
  if (res.count > 0) {
    logInfo("[booking/availability] expired stale pending bookings", { listingId, count: res.count });
  }
  return res.count;
}

/**
 * After `expireStaleBnhubPendingBookings`, any overlapping CONFIRMED / PENDING / AWAITING_HOST_APPROVAL blocks the range.
 */
export async function findOverlappingActiveBnhubBooking(
  tx: Prisma.TransactionClient,
  listingId: string,
  checkIn: Date,
  checkOut: Date
) {
  return tx.booking.findFirst({
    where: {
      listingId,
      status: { in: ["CONFIRMED", "PENDING", "AWAITING_HOST_APPROVAL"] },
      checkIn: { lt: checkOut },
      checkOut: { gt: checkIn },
    },
    select: { id: true, status: true },
  });
}
