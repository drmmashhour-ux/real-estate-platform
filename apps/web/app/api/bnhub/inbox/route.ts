import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/** BNHUB pre-booking inquiry threads for the current user (guest or host). */
export async function GET() {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const threads = await prisma.bnhubInquiryThread.findMany({
    where: {
      OR: [{ guestUserId: userId }, { hostUserId: userId }],
    },
    orderBy: { lastMessageAt: "desc" },
    take: 80,
    include: {
      listing: { select: { id: true, title: true, listingCode: true, city: true } },
      guest: { select: { id: true, name: true, email: true } },
      host: { select: { id: true, name: true, email: true } },
      messages: {
        take: 1,
        orderBy: { createdAt: "desc" },
        select: { body: true, createdAt: true, senderId: true },
      },
    },
  });

  const rows = await Promise.all(
    threads.map(async (t) => {
      const isGuest = t.guestUserId === userId;
      const lastRead = isGuest ? t.guestLastReadAt : t.hostLastReadAt;
      const unread = await prisma.bnhubInquiryMessage.count({
        where: {
          threadId: t.id,
          senderId: { not: userId },
          ...(lastRead ? { createdAt: { gt: lastRead } } : {}),
        },
      });
      const other = isGuest ? t.host : t.guest;
      return {
        id: t.id,
        listingId: t.shortTermListingId,
        listingTitle: t.listing.title,
        listingCode: t.listing.listingCode,
        city: t.listing.city,
        role: isGuest ? "guest" : "host",
        otherParticipant: {
          id: other.id,
          name: other.name,
          email: other.email,
        },
        lastMessageAt: t.lastMessageAt?.toISOString() ?? null,
        lastMessagePreview: t.messages[0]?.body?.slice(0, 160) ?? null,
        unreadCount: unread,
        hostAvgResponseMs: t.hostAvgResponseMs,
        hostResponseSamples: t.hostResponseSamples,
      };
    })
  );

  return NextResponse.json({ threads: rows });
}
