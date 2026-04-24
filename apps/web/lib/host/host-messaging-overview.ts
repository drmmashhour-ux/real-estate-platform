import { prisma } from "@/lib/db";

export type HostBookingConversationSummary = {
  bookingId: string;
  listingId: string;
  listingTitle: string;
  guestId: string;
  guestName: string | null;
  lastMessageAt: string | null;
  messageCount: number;
};

/**
 * Booking-scoped threads (`BookingMessage`) for this host only.
 */
export async function getHostBookingConversationsOverview(hostId: string): Promise<HostBookingConversationSummary[]> {
  const bookings = await prisma.booking.findMany({
    where: { listing: { ownerId: hostId } },
    select: {
      id: true,
      listingId: true,
      guestId: true,
      listing: { select: { title: true } },
      guest: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 80,
  });

  const bookingIds = bookings.map((b) => b.id);
  if (bookingIds.length === 0) return [];

  const agg = await prisma.bookingMessage.groupBy({
    by: ["bookingId"],
    where: { bookingId: { in: bookingIds } },
    _count: { _all: true },
    _max: { createdAt: true },
  });
  const byBooking = new Map(agg.map((a) => [a.bookingId, a]));

  return bookings.map((b) => {
    const g = byBooking.get(b.id);
    return {
      bookingId: b.id,
      listingId: b.listingId,
      listingTitle: b.listing.title,
      guestId: b.guestId,
      guestName: b.guest.name,
      lastMessageAt: g?._max.createdAt?.toISOString() ?? null,
      messageCount: g?._count._all ?? 0,
    };
  });
}
