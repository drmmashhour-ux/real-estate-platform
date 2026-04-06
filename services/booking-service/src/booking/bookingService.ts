import { prisma } from "../db.js";
import type { BookingStatus } from "../generated/prisma/index.js";
import { calculateBookingPrice, nightsBetween } from "./price.js";
import { isListingAvailable } from "./availability.js";
import type { CreateBookingBody, UpdateBookingBody } from "../validation/schemas.js";

const bookingInclude = {
  listing: {
    select: {
      id: true,
      title: true,
      city: true,
      address: true,
      nightPriceCents: true,
      photos: true,
      maxGuests: true,
    },
  },
  guest: { select: { id: true, name: true, email: true } },
  payment: true,
} as const;

export async function createBooking(data: CreateBookingBody) {
  const checkIn = new Date(data.checkIn);
  const checkOut = new Date(data.checkOut);
  const nights = nightsBetween(checkIn, checkOut);
  if (nights < 1) throw new Error("Invalid dates: checkOut must be after checkIn");

  const listing = await prisma.shortTermListing.findUnique({ where: { id: data.listingId } });
  if (!listing) throw new Error("Listing not found");

  const available = await isListingAvailable(data.listingId, checkIn, checkOut);
  if (!available) throw new Error("Listing not available for selected dates");

  const { totalCents, guestFeeCents, hostFeeCents, hostPayoutCents, guestTotalCents } =
    calculateBookingPrice(listing.nightPriceCents, nights);

  const [booking] = await prisma.$transaction([
    prisma.booking.create({
      data: {
        listingId: data.listingId,
        guestId: data.guestId,
        checkIn,
        checkOut,
        nights,
        totalCents,
        guestFeeCents,
        hostFeeCents,
        status: "PENDING",
        guestNotes: data.guestNotes,
      },
    }),
  ]);

  await prisma.payment.create({
    data: {
      bookingId: booking.id,
      amountCents: guestTotalCents,
      guestFeeCents,
      hostFeeCents,
      hostPayoutCents,
      status: "PENDING",
    },
  });

  return prisma.booking.findUniqueOrThrow({
    where: { id: booking.id },
    include: bookingInclude,
  });
}

export async function getBookingById(bookingId: string) {
  return prisma.booking.findUnique({
    where: { id: bookingId },
    include: bookingInclude,
  });
}

export async function updateBooking(bookingId: string, data: UpdateBookingBody) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return null;

  const updateData: { guestNotes?: string; checkedInAt?: Date | null; checkedOutAt?: Date | null } = {};
  if (data.guestNotes !== undefined) updateData.guestNotes = data.guestNotes;
  if (data.checkedInAt !== undefined) updateData.checkedInAt = data.checkedInAt ? new Date(data.checkedInAt) : null;
  if (data.checkedOutAt !== undefined) updateData.checkedOutAt = data.checkedOutAt ? new Date(data.checkedOutAt) : null;

  return prisma.booking.update({
    where: { id: bookingId },
    data: updateData,
    include: bookingInclude,
  });
}

/** Cancel booking: only PENDING or CONFIRMED can be cancelled. Payment status set to REFUNDED when applicable. */
export async function cancelBooking(bookingId: string): Promise<{ success: true; booking: Awaited<ReturnType<typeof getBookingById>> } | { success: false; error: string }> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payment: true },
  });
  if (!booking) return { success: false, error: "Booking not found" };

  const status: BookingStatus = booking.status;
  if (status !== "PENDING" && status !== "CONFIRMED") {
    return { success: false, error: `Booking cannot be cancelled (status: ${status})` };
  }

  await prisma.$transaction([
    prisma.booking.update({
      where: { id: bookingId },
      data: { status: "CANCELLED" },
    }),
    ...(booking.payment
      ? [
          prisma.payment.update({
            where: { bookingId },
            data: { status: "REFUNDED" },
          }),
        ]
      : []),
  ]);

  const updated = await getBookingById(bookingId);
  return { success: true, booking: updated! };
}

/** Status transitions: PENDING -> CONFIRMED (e.g. after payment), CONFIRMED -> COMPLETED (after checkout). */
export async function setBookingStatus(
  bookingId: string,
  newStatus: BookingStatus
): Promise<{ success: true; booking: Awaited<ReturnType<typeof getBookingById>> } | { success: false; error: string }> {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return { success: false, error: "Booking not found" };

  const allowed: Record<BookingStatus, BookingStatus[]> = {
    PENDING: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["COMPLETED", "CANCELLED"],
    CANCELLED: [],
    COMPLETED: [],
  };
  if (!allowed[booking.status]?.includes(newStatus)) {
    return { success: false, error: `Cannot transition from ${booking.status} to ${newStatus}` };
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: newStatus },
  });

  const updated = await getBookingById(bookingId);
  return { success: true, booking: updated! };
}
