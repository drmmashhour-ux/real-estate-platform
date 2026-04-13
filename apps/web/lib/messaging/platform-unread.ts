import { prisma } from "@/lib/db";
import { getUnreadMessageCountForUser } from "@/modules/messaging/services/get-unread-count";

async function countBnhubInquiryUnread(userId: string): Promise<number> {
  const threads = await prisma.bnhubInquiryThread.findMany({
    where: {
      OR: [{ guestUserId: userId }, { hostUserId: userId }],
    },
    select: {
      id: true,
      guestUserId: true,
      guestLastReadAt: true,
      hostLastReadAt: true,
    },
  });
  let total = 0;
  for (const t of threads) {
    const isGuest = t.guestUserId === userId;
    const lastRead = isGuest ? t.guestLastReadAt : t.hostLastReadAt;
    const n = await prisma.bnhubInquiryMessage.count({
      where: {
        threadId: t.id,
        senderId: { not: userId },
        ...(lastRead ? { createdAt: { gt: lastRead } } : {}),
      },
    });
    total += n;
  }
  return total;
}

async function countBookingChatUnread(userId: string): Promise<number> {
  const bookings = await prisma.booking.findMany({
    where: {
      OR: [{ guestId: userId }, { listing: { ownerId: userId } }],
    },
    select: {
      id: true,
      guestId: true,
      guestLastReadBookingMessagesAt: true,
      hostLastReadBookingMessagesAt: true,
    },
  });
  let total = 0;
  for (const b of bookings) {
    const isGuest = b.guestId === userId;
    const lastRead = isGuest ? b.guestLastReadBookingMessagesAt : b.hostLastReadBookingMessagesAt;
    const n = await prisma.bookingMessage.count({
      where: {
        bookingId: b.id,
        senderId: { not: userId },
        ...(lastRead ? { createdAt: { gt: lastRead } } : {}),
      },
    });
    total += n;
  }
  return total;
}

/** CRM conversations + BNHUB inquiry + booking chat (messages without relying on notification rows). */
export async function getTotalMessagingUnreadCount(userId: string): Promise<number> {
  const [crm, inquiry, booking] = await Promise.all([
    getUnreadMessageCountForUser(userId),
    countBnhubInquiryUnread(userId),
    countBookingChatUnread(userId),
  ]);
  return crm + inquiry + booking;
}
