/**
 * BNHub booking creation validation — dates, overlap, listing structure.
 * Does not charge cards or call Stripe; `createBooking` remains authoritative for final writes.
 */

import { prisma } from "@/lib/db";
import {
  expireStaleBnhubPendingBookings,
  findOverlappingActiveBnhubBooking,
  findOverlappingExternalIcsBlock,
} from "@/lib/bookings/checkAvailability";
import { utcDayStart } from "@/lib/bnhub/availability-day-helpers";

export type ShortTermListingBookingValidationShape = {
  id: string;
  title: string;
  description: string | null;
  nightPriceCents: number;
  maxGuests: number;
  photos: unknown;
  amenities: unknown;
  listingPhotos?: { id: string }[];
};

/** Normalize parsed dates to UTC `YYYY-MM-DD` for deterministic calendar alignment. */
export function normalizeBnhubBookingDatesToYmd(checkIn: string, checkOut: string): {
  checkInYmd: string;
  checkOutYmd: string;
} | null {
  const cIn = new Date(checkIn);
  const cOut = new Date(checkOut);
  if (Number.isNaN(cIn.getTime()) || Number.isNaN(cOut.getTime())) return null;
  return {
    checkInYmd: cIn.toISOString().slice(0, 10),
    checkOutYmd: cOut.toISOString().slice(0, 10),
  };
}

/** Checkout-exclusive stay: occupied nights are [checkIn, checkOut) in UTC day alignment with availability slots. */
export function validateBnhubBookingDateStrings(checkIn: string, checkOut: string): { ok: true } | { ok: false; error: string } {
  const checkInD = new Date(checkIn);
  const checkOutD = new Date(checkOut);
  if (Number.isNaN(checkInD.getTime()) || Number.isNaN(checkOutD.getTime())) {
    return { ok: false, error: "Invalid check-in or check-out date." };
  }
  if (!(checkInD < checkOutD)) {
    return { ok: false, error: "Check-out must be after check-in (checkout-exclusive: last night is the night before departure)." };
  }
  const nights = Math.ceil((checkOutD.getTime() - checkInD.getTime()) / (1000 * 60 * 60 * 24));
  if (nights < 1) {
    return { ok: false, error: "Stay must be at least one night." };
  }
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const cin = new Date(checkInD);
  cin.setUTCHours(0, 0, 0, 0);
  if (cin < today) {
    return { ok: false, error: "Check-in cannot be in the past." };
  }
  return { ok: true };
}

function jsonArrayLen(v: unknown): number {
  return Array.isArray(v) ? v.length : 0;
}

export function countBnhubListingPhotos(listing: ShortTermListingBookingValidationShape): number {
  const rel = listing.listingPhotos?.length ?? 0;
  const legacy = jsonArrayLen(listing.photos);
  return Math.max(rel, legacy);
}

export function countBnhubListingAmenities(listing: ShortTermListingBookingValidationShape): number {
  return jsonArrayLen(listing.amenities);
}

/**
 * Enforces minimum listing structure for new bookings (published listings only should call this).
 */
export function validateBnhubListingStructureForBooking(
  listing: ShortTermListingBookingValidationShape
): { ok: true } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const title = listing.title?.trim() ?? "";
  if (title.length < 3) {
    errors.push("Listing title is required (min 3 characters).");
  }
  const desc = listing.description?.trim() ?? "";
  if (desc.length < 20) {
    errors.push("Listing description is required (min 20 characters).");
  }
  if (!Number.isFinite(listing.nightPriceCents) || listing.nightPriceCents < 1) {
    errors.push("Listing must have a valid nightly price (price_per_night / nightPriceCents > 0).");
  }
  if (!Number.isFinite(listing.maxGuests) || listing.maxGuests < 1) {
    errors.push("Listing must specify max guests (at least 1).");
  }
  const photoCount = countBnhubListingPhotos(listing);
  if (photoCount < 3) {
    errors.push("Listing must have at least 3 photos.");
  }
  const amenityCount = countBnhubListingAmenities(listing);
  if (amenityCount < 3) {
    errors.push("Listing must have at least 3 amenities.");
  }
  if (errors.length) return { ok: false, errors };
  return { ok: true };
}

/**
 * Expires stale pending holds, then checks overlapping active bookings and blocked calendar slots
 * (mirrors the guard inside `createBooking` transaction).
 */
export async function precheckBnhubBookingAvailability(
  listingId: string,
  checkIn: Date,
  checkOut: Date
): Promise<{ available: true } | { available: false; reason: "overlap" | "calendar" }> {
  return prisma.$transaction(async (tx) => {
    await expireStaleBnhubPendingBookings(tx, listingId);
    const overlapping = await findOverlappingActiveBnhubBooking(tx, listingId, checkIn, checkOut);
    if (overlapping) {
      return { available: false, reason: "overlap" };
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
      return { available: false, reason: "calendar" };
    }

    const icsBlock = await findOverlappingExternalIcsBlock(tx, listingId, checkIn, checkOut);
    if (icsBlock) {
      return { available: false, reason: "calendar" };
    }

    return { available: true };
  });
}

export const bnhubBookingCreateLogTag = "[bnhub:booking:create]" as const;

export function logBnhubBookingCreate(payload: Record<string, unknown>): void {
  try {
    console.info(bnhubBookingCreateLogTag, payload);
  } catch {
    /* noop */
  }
}
