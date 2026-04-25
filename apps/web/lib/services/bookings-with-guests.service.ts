/**
 * Application-level joins for Booking → User (guest).
 *
 * Today: one Prisma client (`@/lib/db`). The batch pattern (findMany + `id: { in }` + Map)
 * is the same when you split generators: replace with
 * `marketplaceDb.booking` / `coreDb.user` (or your domain names) and keep only FK columns
 * in each schema (no cross-schema @relation).
 */
import type { Booking, Prisma, User } from "@prisma/client";
import { prisma } from "@/lib/db";
import { joinByForeignKey } from "@/lib/utils/join-by-id";
import type { BookingWithGuest } from "@/types/booking-with-guest";

export async function getBookingWithGuest(id: string): Promise<BookingWithGuest | null> {
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) return null;
  const guest = await prisma.user.findUnique({ where: { id: booking.guestId } });
  return { ...booking, guest: guest ?? null };
}

/**
 * Batches guest loads to avoid N+1 (see `joinByForeignKey` + `indexById` in join-by-id.ts).
 */
export async function getBookingsWithGuests(
  where: Prisma.BookingWhereInput,
): Promise<BookingWithGuest[]> {
  const bookings = await prisma.booking.findMany({ where, orderBy: { createdAt: "desc" } });
  if (bookings.length === 0) return [];

  const guestIds = [...new Set(bookings.map((b) => b.guestId))];
  const guests = await prisma.user.findMany({
    where: { id: { in: guestIds } },
  });
  return joinByForeignKey(bookings, guests, "guestId", "guest");
}

/**
 * When you have booking ids already, single round-trip to bookings + one to users.
 */
export async function getBookingsWithGuestsByIds(
  bookingIds: string[],
): Promise<BookingWithGuest[]> {
  if (bookingIds.length === 0) return [];
  return getBookingsWithGuests({ id: { in: bookingIds } });
}

export type { Booking, User, BookingWithGuest };
