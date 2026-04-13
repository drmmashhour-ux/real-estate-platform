import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/** Mark booking chat or BNHUB inquiry thread as read for the current user. */
export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    bookingId?: unknown;
    threadId?: unknown;
  };
  const bookingId = typeof body.bookingId === "string" ? body.bookingId.trim() : "";
  const threadId = typeof body.threadId === "string" ? body.threadId.trim() : "";
  const now = new Date();

  if (threadId) {
    const thread = await prisma.bnhubInquiryThread.findFirst({
      where: {
        id: threadId,
        OR: [{ guestUserId: userId }, { hostUserId: userId }],
      },
      select: { id: true, guestUserId: true },
    });
    if (!thread) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const isGuest = thread.guestUserId === userId;
    await prisma.bnhubInquiryThread.update({
      where: { id: threadId },
      data: isGuest ? { guestLastReadAt: now } : { hostLastReadAt: now },
    });
    return NextResponse.json({ ok: true });
  }

  if (bookingId) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { guestId: true, listing: { select: { ownerId: true } } },
    });
    if (!booking) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const isGuest = booking.guestId === userId;
    const isHost = booking.listing.ownerId === userId;
    if (!isGuest && !isHost) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await prisma.booking.update({
      where: { id: bookingId },
      data: isGuest
        ? { guestLastReadBookingMessagesAt: now }
        : { hostLastReadBookingMessagesAt: now },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "bookingId or threadId required" }, { status: 400 });
}
