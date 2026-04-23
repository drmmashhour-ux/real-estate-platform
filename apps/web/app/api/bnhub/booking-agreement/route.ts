import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { getBookingAgreementRecord } from "@/lib/agreements/platform-agreements";

/**
 * GET /api/bnhub/booking-agreement?bookingId=...
 * Returns the stored booking agreement for a booking (guest or host only).
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("bookingId")?.trim();
    if (!bookingId) {
      return Response.json({ error: "bookingId required" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { guestId: true, listingId: true, listing: { select: { ownerId: true } } },
    });
    if (!booking) {
      return Response.json({ error: "Booking not found" }, { status: 404 });
    }

    const isGuest = booking.guestId === userId;
    const isHost = booking.listing?.ownerId === userId;
    if (!isGuest && !isHost) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    const agreement = await getBookingAgreementRecord(bookingId);
    if (!agreement) {
      return Response.json({ error: "No agreement found for this booking" }, { status: 404 });
    }

    return Response.json({
      id: agreement.id,
      agreementType: agreement.agreementType,
      version: agreement.version,
      contentHtml: agreement.contentHtml,
      acceptedAt: agreement.acceptedAt.toISOString(),
      metadata: agreement.metadata,
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to load agreement" },
      { status: 500 }
    );
  }
}
