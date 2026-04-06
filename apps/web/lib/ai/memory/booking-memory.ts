import { prisma } from "@/lib/db";

export async function loadBookingContextForUser(bookingId: string, userId: string) {
  return prisma.booking.findFirst({
    where: {
      id: bookingId,
      OR: [{ guestId: userId }, { listing: { ownerId: userId } }],
    },
    select: {
      id: true,
      status: true,
      checkIn: true,
      checkOut: true,
      guestId: true,
      listingId: true,
    },
  });
}
