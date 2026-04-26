import { NotificationPriority, NotificationType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { requireMobileGuestUser } from "@/lib/bnhub/mobile-api";
import { createBnhubMobileNotification } from "@/lib/bnhub/mobile-push";
import { triggerNewMessage } from "@/lib/bnhub/notifications";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await requireMobileGuestUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bookingId = request.nextUrl.searchParams.get("bookingId");
  if (!bookingId) {
    return NextResponse.json({ error: "bookingId required" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      guestId: true,
      listing: {
        select: {
          ownerId: true,
          title: true,
        },
      },
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const isParticipant = booking.guestId === user.id || booking.listing.ownerId === user.id;
  if (!isParticipant) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const messages = await prisma.bookingMessage.findMany({
    where: { bookingId },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    booking: {
      id: bookingId,
      listingTitle: booking.listing.title,
    },
    messages: messages.map((message) => ({
      id: message.id,
      body: message.body,
      createdAt: message.createdAt.toISOString(),
      sender: message.sender,
    })),
  });
}

export async function POST(request: NextRequest) {
  const user = await requireMobileGuestUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const bookingId = typeof body?.bookingId === "string" ? body.bookingId : "";
  const messageText = typeof body?.body === "string" ? body.body.trim() : "";

  if (!bookingId || !messageText) {
    return NextResponse.json({ error: "bookingId and body required" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      guestId: true,
      listing: {
        select: {
          ownerId: true,
          listingCode: true,
          title: true,
        },
      },
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const isGuest = booking.guestId === user.id;
  const isHost = booking.listing.ownerId === user.id;
  if (!isGuest && !isHost) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const message = await prisma.bookingMessage.create({
    data: {
      bookingId,
      senderId: user.id,
      body: messageText,
      listingCode: booking.listing.listingCode,
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  const recipientId = isGuest ? booking.listing.ownerId : booking.guestId;
  void triggerNewMessage({
    bookingId,
    senderId: user.id,
    recipientId,
  });

  void createBnhubMobileNotification({
    userId: recipientId,
    title: "New message",
    message: `About “${booking.listing.title}”: ${messageText.slice(0, 120)}${messageText.length > 120 ? "…" : ""}`,
    type: NotificationType.MESSAGE,
    priority: NotificationPriority.NORMAL,
    actionUrl: `/bnhub/booking/${bookingId}`,
    actionLabel: "Open",
    listingId: null,
    actorId: user.id,
    pushData: { bookingId, type: "booking_message" },
  }).catch(() => {});

  return NextResponse.json({
    message: {
      id: message.id,
      body: message.body,
      createdAt: message.createdAt.toISOString(),
      sender: message.sender,
    },
  });
}
