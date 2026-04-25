/**
 * Central BNHub availability checks for a stay range [checkIn, checkOut) (checkout exclusive).
 * Use inside Serializable transactions; never trust client-only validation.
 */

import { AvailabilityBlockType, BookingStatus, Prisma } from "@prisma/client";
import {
  expireStaleBnhubPendingBookings,
  findOverlappingActiveBnhubBooking,
  findOverlappingExternalIcsBlock,
} from "@/lib/bookings/checkAvailability";
import { eachNightBetween, utcDayStart } from "@/lib/bnhub/availability-day-helpers";

const ACTIVE_BOOKING: BookingStatus[] = [
  BookingStatus.CONFIRMED,
  BookingStatus.PENDING,
  BookingStatus.AWAITING_HOST_APPROVAL,
];

export type StayRange = {
  checkIn: Date;
  checkOut: Date;
};

function parseHoldReason(reason: string | null | undefined): { expiresAt?: string; holdId?: string } {
  if (!reason?.trim()) return {};
  try {
    const o = JSON.parse(reason) as { expiresAt?: string; holdId?: string };
    return o && typeof o === "object" ? o : {};
  } catch {
    return {};
  }
}

/**
 * List UTC calendar dates (Date at 00:00Z) in [checkIn, checkOut) that already have a BookingNight
 * tied to an active (inventory-blocking) booking.
 */
export async function getOccupiedNights(
  tx: Prisma.TransactionClient,
  listingId: string,
  startDate: Date,
  endDate: Date,
): Promise<{ stayDate: Date; bookingId: string; status: BookingStatus }[]> {
  const rangeStart = utcDayStart(startDate);
  const rangeEnd = utcDayStart(endDate);
  const rows = await tx.bookingNight.findMany({
    where: {
      listingId,
      stayDate: { gte: rangeStart, lt: rangeEnd },
      booking: { status: { in: ACTIVE_BOOKING } },
    },
    select: { stayDate: true, bookingId: true, booking: { select: { status: true } } },
  });
  return rows.map((r) => ({
    stayDate: r.stayDate,
    bookingId: r.bookingId,
    status: r.booking.status,
  }));
}

/**
 * True when a BOOKING_HOLD row is still within TTL (default 15m). Expired holds are treated as not blocking.
 */
export function isBookingHoldActive(reason: string | null | undefined, now: Date = new Date()): boolean {
  const { expiresAt } = parseHoldReason(reason);
  if (!expiresAt) return false;
  const t = new Date(expiresAt);
  return Number.isFinite(t.getTime()) && t.getTime() > now.getTime();
}

/**
 * All server-side checks for a new stay. Throws Error with a host-safe message if unavailable.
 * Call after `expireStaleBnhubPendingBookings` when applicable.
 */
export async function assertInventoryAvailableForNewStay(
  tx: Prisma.TransactionClient,
  params: {
    listingId: string;
    checkIn: Date;
    checkOut: Date;
    /** When converting a hold, ignore this block row in overlap. */
    ignoreAvailabilityBlockId?: string;
    /**
     * When re-validating an existing PENDING/approved booking (e.g. at payment), exclude that booking
     * from “other” overlap and from BookingNight conflicts.
     */
    excludeBookingId?: string;
  },
): Promise<void> {
  const { listingId, checkIn, checkOut, ignoreAvailabilityBlockId, excludeBookingId } = params;

  const overlapBooking = await findOverlappingActiveBnhubBooking(
    tx,
    listingId,
    checkIn,
    checkOut,
    excludeBookingId,
  );
  if (overlapBooking) {
    throw new Error("Selected dates are no longer available.");
  }

  const rangeStart = utcDayStart(checkIn);
  const rangeEnd = utcDayStart(checkOut);
  const blockedSlot = await tx.availabilitySlot.findFirst({
    where: {
      listingId,
      date: { gte: rangeStart, lt: rangeEnd },
      OR: [{ available: false }, { dayStatus: { in: ["BLOCKED", "BOOKED"] } }],
    },
  });
  if (blockedSlot) {
    throw new Error("Listing not available for selected dates");
  }

  const icsBlock = await findOverlappingExternalIcsBlock(tx, listingId, checkIn, checkOut);
  if (icsBlock) {
    throw new Error("Listing not available for selected dates");
  }

  const stayStart = utcDayStart(checkIn);
  const stayEnd = utcDayStart(checkOut);
  const blocks = await tx.availabilityBlock.findMany({
    where: {
      listingId,
      id: ignoreAvailabilityBlockId ? { not: ignoreAvailabilityBlockId } : undefined,
      startDate: { lt: stayEnd },
      endDate: { gt: stayStart },
    },
    select: { id: true, blockType: true, reason: true },
  });
  for (const bl of blocks) {
    if (bl.blockType === AvailabilityBlockType.BOOKING_HOLD) {
      if (isBookingHoldActive(bl.reason)) {
        throw new Error("These dates are temporarily on hold. Try again in a few minutes or pick other dates.");
      }
      continue;
    }
    if (
      bl.blockType === AvailabilityBlockType.HOST_BLOCK ||
      bl.blockType === AvailabilityBlockType.MAINTENANCE
    ) {
      throw new Error("Listing not available for selected dates");
    }
  }

  const nights = eachNightBetween(checkIn, checkOut);
  for (const night of nights) {
    const conflict = await tx.bookingNight.findFirst({
      where: {
        listingId,
        stayDate: utcDayStart(night),
        bookingId: excludeBookingId ? { not: excludeBookingId } : undefined,
        booking: { status: { in: ACTIVE_BOOKING } },
      },
      select: { bookingId: true },
    });
    if (conflict) {
      throw new Error("Selected dates are no longer available.");
    }
  }
}

/** Read path (no transaction) for dashboards / pre-check APIs. */
export async function checkAvailability(
  listingId: string,
  checkIn: Date,
  checkOut: Date,
): Promise<{ available: boolean; reason?: string }> {
  const { prisma } = await import("@/lib/db");
  try {
    await prisma.$transaction(
      async (tx) => {
        await expireStaleBnhubPendingBookings(tx, listingId);
        await assertInventoryAvailableForNewStay(tx, { listingId, checkIn, checkOut });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 5000, timeout: 10000 },
    );
    return { available: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unavailable";
    return { available: false, reason: message };
  }
}

export { expireStaleBnhubPendingBookings };
