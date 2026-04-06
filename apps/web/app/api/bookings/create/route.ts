import { NextRequest } from "next/server";
import { createBooking } from "@/lib/bnhub/booking";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { logApiRouteError } from "@/lib/api/dev-log";
import { GuestIdentityRequiredError } from "@/lib/bnhub/guest-identity-gate";

export const dynamic = "force-dynamic";

/**
 * POST /api/bookings/create — validate + create pending (or awaiting host) booking.
 */
export async function POST(request: NextRequest) {
  try {
    const guestId = await getGuestId();
    if (!guestId) {
      return Response.json({ error: "Sign in required to book." }, { status: 401 });
    }

    const body = (await request.json()) as {
      listingId?: string;
      checkIn?: string;
      checkOut?: string;
      guestsCount?: number;
      guestEmail?: string;
      guestName?: string;
      guestPhone?: string;
      guestNotes?: string;
      specialRequest?: string;
      specialRequestsJson?: Record<string, unknown> | null;
    };

    const listingId = typeof body.listingId === "string" ? body.listingId.trim() : "";
    const checkIn = typeof body.checkIn === "string" ? body.checkIn.trim() : "";
    const checkOut = typeof body.checkOut === "string" ? body.checkOut.trim() : "";
    if (!listingId || !checkIn || !checkOut) {
      return Response.json({ error: "listingId, checkIn, and checkOut are required." }, { status: 400 });
    }

    const checkInD = new Date(checkIn);
    const checkOutD = new Date(checkOut);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    if (!(checkInD < checkOutD)) {
      return Response.json({ error: "Check-out must be after check-in." }, { status: 400 });
    }
    if (checkInD < today) {
      return Response.json({ error: "Check-in cannot be in the past." }, { status: 400 });
    }

    const guestsCount =
      typeof body.guestsCount === "number" && body.guestsCount > 0
        ? Math.min(50, Math.max(1, Math.floor(body.guestsCount)))
        : undefined;

    const booking = await createBooking({
      listingId,
      guestId,
      checkIn,
      checkOut,
      guestCount: guestsCount,
      guestContactEmail: typeof body.guestEmail === "string" ? body.guestEmail : undefined,
      guestContactName: typeof body.guestName === "string" ? body.guestName : undefined,
      guestContactPhone: typeof body.guestPhone === "string" ? body.guestPhone : undefined,
      guestNotes: typeof body.guestNotes === "string" ? body.guestNotes : undefined,
      specialRequest: typeof body.specialRequest === "string" ? body.specialRequest : undefined,
      specialRequestsJson:
        body.specialRequestsJson && typeof body.specialRequestsJson === "object"
          ? body.specialRequestsJson
          : undefined,
    });

    logInfo("[booking/create]", {
      bookingId: booking.id,
      listingId,
      guestId,
      status: booking.status,
    });

    const pay = await prisma.payment.findUnique({
      where: { bookingId: booking.id },
      select: { amountCents: true },
    });

    return Response.json({
      id: booking.id,
      summary: {
        status: booking.status,
        checkIn: booking.checkIn.toISOString(),
        checkOut: booking.checkOut.toISOString(),
        nights: booking.nights,
        confirmationCode: booking.confirmationCode,
        totalCents: pay?.amountCents ?? null,
        currency: "CAD",
      },
    });
  } catch (e) {
    if (e instanceof GuestIdentityRequiredError) {
      return Response.json({ error: e.message, code: e.code }, { status: 403 });
    }
    const msg = e instanceof Error ? e.message : "Booking could not be created.";
    if (
      msg.includes("Selected dates are no longer available") ||
      msg.includes("Listing not available for selected dates")
    ) {
      return Response.json({ error: "Selected dates are no longer available." }, { status: 409 });
    }
    if (msg.includes("at most") && msg.includes("guests")) {
      return Response.json({ error: msg }, { status: 400 });
    }
    if (msg.includes("not available for booking") || msg.includes("PUBLISHED")) {
      return Response.json({ error: msg }, { status: 403 });
    }
    logApiRouteError("POST /api/bookings/create", e);
    return Response.json({ error: "Booking could not be created. Try again or contact support." }, { status: 500 });
  }
}
