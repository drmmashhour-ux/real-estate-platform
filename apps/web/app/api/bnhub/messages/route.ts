import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { triggerNewMessage } from "@/lib/bnhub/notifications";
import { appendBnhubInquiryMessage, getOrCreateBnhubInquiryThread } from "@/lib/bnhub/inquiry-messaging";
import { nextRollingAverageMs } from "@/lib/messaging/response-time";

export const dynamic = "force-dynamic";

/** GET: `?bookingId=` (booking chat) or `?threadId=` (pre-booking inquiry). */
export async function GET(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

    const bookingId = request.nextUrl.searchParams.get("bookingId");
    const threadId = request.nextUrl.searchParams.get("threadId");

    if (threadId) {
      const thread = await prisma.bnhubInquiryThread.findFirst({
        where: {
          id: threadId,
          OR: [{ guestUserId: userId }, { hostUserId: userId }],
        },
        include: {
          listing: { select: { id: true, title: true, listingCode: true } },
        },
      });
      if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404 });

      const messages = await prisma.bnhubInquiryMessage.findMany({
        where: { threadId: thread.id },
        include: { sender: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      });
      return NextResponse.json({ thread, messages });
    }

    if (bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: { guestId: true, listing: { select: { ownerId: true, listingCode: true } } },
      });
      if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      const isGuest = booking.guestId === userId;
      const isHost = booking.listing.ownerId === userId;
      if (!isGuest && !isHost) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

      const messages = await prisma.bookingMessage.findMany({
        where: { bookingId },
        include: { sender: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      });
      return NextResponse.json(messages);
    }

    return NextResponse.json({ error: "bookingId or threadId required" }, { status: 400 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

/** POST: booking chat (`bookingId` + `body`) or listing inquiry (`hostId` + `listingId` + `body`). */
export async function POST(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

    const body = (await request.json().catch(() => ({}))) as {
      bookingId?: unknown;
      threadId?: unknown;
      hostId?: unknown;
      listingId?: unknown;
      body?: unknown;
    };

    const messageBody = typeof body.body === "string" ? body.body.trim() : "";
    if (!messageBody) {
      return NextResponse.json({ error: "body required" }, { status: 400 });
    }

    const inquiryThreadId = typeof body.threadId === "string" ? body.threadId.trim() : "";
    if (inquiryThreadId) {
      const append = await appendBnhubInquiryMessage({
        threadId: inquiryThreadId,
        senderId: userId,
        body: messageBody,
      });
      if ("error" in append) {
        return NextResponse.json({ error: append.error }, { status: append.error === "forbidden" ? 403 : 404 });
      }
      return NextResponse.json({ threadId: inquiryThreadId, message: append.message });
    }

    const bookingId = typeof body.bookingId === "string" ? body.bookingId.trim() : "";

    if (bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: {
          id: true,
          guestId: true,
          bnhubHostAvgBookingResponseMs: true,
          bnhubHostBookingResponseSamples: true,
          listing: { select: { ownerId: true, listingCode: true, title: true } },
        },
      });
      if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      const isGuest = booking.guestId === userId;
      const isHost = booking.listing.ownerId === userId;
      if (!isGuest && !isHost) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

      const prev = await prisma.bookingMessage.findFirst({
        where: { bookingId },
        orderBy: { createdAt: "desc" },
        select: { senderId: true, createdAt: true },
      });

      const message = await prisma.bookingMessage.create({
        data: {
          bookingId,
          senderId: userId,
          body: messageBody,
          listingCode: booking.listing.listingCode,
        },
        include: { sender: { select: { id: true, name: true, email: true } } },
      });

      let bnhubHostAvgBookingResponseMs = booking.bnhubHostAvgBookingResponseMs;
      let bnhubHostBookingResponseSamples = booking.bnhubHostBookingResponseSamples;
      if (
        isHost &&
        prev &&
        prev.senderId === booking.guestId
      ) {
        const delta = message.createdAt.getTime() - prev.createdAt.getTime();
        if (delta >= 0 && delta < 1000 * 60 * 60 * 48) {
          const { avg, count } = nextRollingAverageMs(
            booking.bnhubHostAvgBookingResponseMs,
            booking.bnhubHostBookingResponseSamples,
            delta
          );
          bnhubHostAvgBookingResponseMs = avg;
          bnhubHostBookingResponseSamples = count;
          await prisma.booking.update({
            where: { id: bookingId },
            data: {
              bnhubHostAvgBookingResponseMs,
              bnhubHostBookingResponseSamples,
            },
          });
        }
      }

      const recipientId = isGuest ? booking.listing.ownerId : booking.guestId;
      void triggerNewMessage({ bookingId, senderId: userId, recipientId });

      return NextResponse.json(message);
    }

    const hostId = typeof body.hostId === "string" ? body.hostId.trim() : "";
    const listingId = typeof body.listingId === "string" ? body.listingId.trim() : "";
    if (!hostId || !listingId) {
      return NextResponse.json(
        { error: "bookingId+body, or hostId+listingId+body required" },
        { status: 400 }
      );
    }

    const listing = await prisma.shortTermListing.findFirst({
      where: { id: listingId, ownerId: hostId },
      select: { id: true, title: true, listingCode: true, ownerId: true },
    });
    if (!listing) {
      return NextResponse.json({ error: "Listing not found for this host" }, { status: 404 });
    }

    const threadResult = await getOrCreateBnhubInquiryThread({
      shortTermListingId: listing.id,
      guestUserId: userId,
    });
    if ("error" in threadResult) {
      const code = threadResult.error;
      if (code === "listing_not_found") return NextResponse.json({ error: "Listing not found" }, { status: 404 });
      return NextResponse.json({ error: "You cannot message your own listing" }, { status: 400 });
    }

    const append = await appendBnhubInquiryMessage({
      threadId: threadResult.thread.id,
      senderId: userId,
      body: messageBody,
    });
    if ("error" in append) {
      return NextResponse.json({ error: append.error }, { status: 403 });
    }

    return NextResponse.json({
      threadId: threadResult.thread.id,
      message: append.message,
      listingCode: listing.listingCode,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
