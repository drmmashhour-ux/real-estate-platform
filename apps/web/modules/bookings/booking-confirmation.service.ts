/**
 * Payment-time inventory re-validation and idempotent night materialization.
 */

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { assertInventoryAvailableForNewStay } from "./availability.service";
import { expireStaleBnhubPendingBookings } from "@/lib/bookings/checkAvailability";
import { upsertBookedNightsForBooking } from "@/lib/bnhub/availability-day-helpers";
import { createBooking } from "@/lib/bnhub/booking";

type CreateBookingParams = Parameters<typeof createBooking>[0];

/**
 * Second-phase booking creation: same as `createBooking`, but consumes a hold block id.
 * Runs inside the same Serializable transaction rules as `createBooking`.
 */
export async function confirmBookingFromHold(
  args: CreateBookingParams & { releaseAvailabilityBlockId: string }
) {
  const { releaseAvailabilityBlockId, ...rest } = args;
  return createBooking({
    ...rest,
    releaseAvailabilityBlockId,
  });
}

/**
 * Re-check that no *other* booking blocked this range before we flip to CONFIRMED.
 * The subject booking is excluded. Run inside or outside a larger transaction — here we use our own tx.
 */
export async function recheckInventoryBeforePaymentConfirmation(
  bookingId: string
): Promise<{ ok: true } | { ok: false; code: "OVERLAP" | "NOT_FOUND" | "UNKNOWN" }> {
  const row = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, listingId: true, checkIn: true, checkOut: true, status: true },
  });
  if (!row) return { ok: false, code: "NOT_FOUND" };
  try {
    await prisma.$transaction(
      async (tx) => {
        await expireStaleBnhubPendingBookings(tx, row.listingId);
        await assertInventoryAvailableForNewStay(tx, {
          listingId: row.listingId,
          checkIn: row.checkIn,
          checkOut: row.checkOut,
          excludeBookingId: row.id,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 5000, timeout: 20000 }
    );
    return { ok: true };
  } catch {
    return { ok: false, code: "OVERLAP" };
  }
}

/**
 * If webhook fires twice, `createMany`+`skipDuplicates` keeps `BookingNight` idempotent; this backfills
 * if a legacy path left nights empty for a paid/confirmed stay.
 */
export async function ensureBookingNightsIdempotentForBooking(bookingId: string): Promise<void> {
  const b = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, listingId: true, checkIn: true, checkOut: true, status: true },
  });
  if (!b || b.status === "CANCELLED" || b.status === "EXPIRED") return;
  const n = await prisma.bookingNight.count({ where: { bookingId } });
  if (n > 0) return;
  await prisma.$transaction(async (tx) => {
    await upsertBookedNightsForBooking(tx, {
      listingId: b.listingId,
      checkIn: b.checkIn,
      checkOut: b.checkOut,
      bookingId: b.id,
    });
  });
}
