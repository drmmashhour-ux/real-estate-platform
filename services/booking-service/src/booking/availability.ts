import type { Prisma } from "@prisma/client";
import { prisma } from "../db.js";

const ACTIVE_BOOKING_STATUSES = ["CONFIRMED", "PENDING"] as const;

/**
 * Check if a listing is available for the given date range (no overlapping CONFIRMED/PENDING bookings).
 */
export async function isListingAvailable(
  listingId: string,
  checkIn: Date,
  checkOut: Date,
  excludeBookingId?: string
): Promise<boolean> {
  const where: Prisma.BookingWhereInput = {
    listingId,
    status: { in: [...ACTIVE_BOOKING_STATUSES] },
    OR: [
      { checkIn: { lte: checkIn }, checkOut: { gt: checkIn } },
      { checkIn: { lt: checkOut }, checkOut: { gte: checkOut } },
      { checkIn: { gte: checkIn }, checkOut: { lte: checkOut } },
    ],
  };
  if (excludeBookingId) where.id = { not: excludeBookingId };
  const overlapping = await prisma.booking.findFirst({ where });
  return !overlapping;
}

/**
 * Get availability slots for a listing in a date range (calendar view).
 */
export async function getAvailability(
  listingId: string,
  start: Date,
  end: Date
): Promise<{ date: string; available: boolean }[]> {
  const slots = await prisma.availabilitySlot.findMany({
    where: { listingId, date: { gte: start, lte: end } },
    orderBy: { date: "asc" },
  });
  return slots.map((s) => ({
    date: s.date.toISOString().slice(0, 10),
    available: s.available,
  }));
}
