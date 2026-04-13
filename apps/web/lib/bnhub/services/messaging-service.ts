/**
 * BNHUB MessagingService — send message, retrieve booking chat.
 */

import { prisma } from "@/lib/db";

export const MessagingService = {
  async sendMessage(bookingId: string, senderId: string, body: string) {
    const booking = await prisma.booking.findUniqueOrThrow({
      where: { id: bookingId },
      select: { guestId: true, listingId: true },
    });
    const listing = await prisma.shortTermListing.findUniqueOrThrow({
      where: { id: booking.listingId },
      select: { ownerId: true, listingCode: true },
    });
    const isGuest = booking.guestId === senderId;
    const isHost = listing.ownerId === senderId;
    if (!isGuest && !isHost) throw new Error("Only guest or host can message this booking");
    return prisma.bookingMessage.create({
      data: { bookingId, senderId, body, listingCode: listing.listingCode },
      include: { sender: { select: { id: true, name: true } } },
    });
  },

  async getBookingMessages(bookingId: string, userId: string) {
    const booking = await prisma.booking.findUniqueOrThrow({
      where: { id: bookingId },
      include: { listing: { select: { ownerId: true } } },
    });
    const isGuest = booking.guestId === userId;
    const isHost = booking.listing.ownerId === userId;
    if (!isGuest && !isHost) throw new Error("Only guest or host can view this chat");
    return prisma.bookingMessage.findMany({
      where: { bookingId },
      include: { sender: { select: { id: true, name: true } } },
      orderBy: { createdAt: "asc" },
    });
  },
};
