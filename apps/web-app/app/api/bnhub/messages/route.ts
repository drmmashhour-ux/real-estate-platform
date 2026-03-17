import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { triggerNewMessage } from "@/lib/bnhub/notifications";

/** GET /api/bnhub/messages?bookingId= — List messages for a booking (guest or host). */
export async function GET(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });
    const bookingId = request.nextUrl.searchParams.get("bookingId");
    if (!bookingId) return Response.json({ error: "bookingId required" }, { status: 400 });

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { guestId: true, listing: { select: { ownerId: true } } },
    });
    if (!booking) return Response.json({ error: "Booking not found" }, { status: 404 });
    const isGuest = booking.guestId === userId;
    const isHost = booking.listing.ownerId === userId;
    if (!isGuest && !isHost) return Response.json({ error: "Forbidden" }, { status: 403 });

    const messages = await prisma.bookingMessage.findMany({
      where: { bookingId },
      include: { sender: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    });
    return Response.json(messages);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

/** POST /api/bnhub/messages — Send a message in a booking thread. */
export async function POST(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

    const body = await request.json();
    const { bookingId, body: messageBody } = body;
    if (!bookingId || typeof messageBody !== "string" || !messageBody.trim()) {
      return Response.json({ error: "bookingId and body required" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { guestId: true, listing: { select: { ownerId: true } } },
    });
    if (!booking) return Response.json({ error: "Booking not found" }, { status: 404 });
    const isGuest = booking.guestId === userId;
    const isHost = booking.listing.ownerId === userId;
    if (!isGuest && !isHost) return Response.json({ error: "Forbidden" }, { status: 403 });

    const message = await prisma.bookingMessage.create({
      data: { bookingId, senderId: userId, body: messageBody.trim() },
      include: { sender: { select: { id: true, name: true, email: true } } },
    });
    const recipientId = isGuest ? booking.listing.ownerId : booking.guestId;
    void triggerNewMessage({ bookingId, senderId: userId, recipientId });
    return Response.json(message);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to send message" }, { status: 500 });
  }
}
