import { NextRequest } from "next/server";
import { calculateBookingQuote } from "@/lib/bookings/calculateBookingQuote";
import { getGuestId } from "@/lib/auth/session";
import { logInfo } from "@/lib/logger";
import { logApiRouteError } from "@/lib/api/dev-log";

export const dynamic = "force-dynamic";

/**
 * POST /api/bookings/quote — live price preview only (no booking row).
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      listingId?: string;
      checkIn?: string;
      checkOut?: string;
      guestsCount?: number;
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
        ? Math.floor(body.guestsCount)
        : undefined;

    const guestUserId = (await getGuestId()) ?? undefined;

    const result = await calculateBookingQuote({
      listingId,
      checkIn,
      checkOut,
      guestsCount,
      guestUserId,
    });
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: result.httpStatus });
    }
    const q = result.quote;
    logInfo("[booking/quote]", { listingId, nights: q.nights, totalAmount: q.totalAmount, currency: q.currency });
    return Response.json({
      nights: q.nights,
      baseAmount: q.baseAmount,
      grossSubtotalCents: q.grossSubtotalCents,
      cleaningFee: q.cleaningFee,
      serviceFee: q.serviceFee,
      taxesAmount: q.taxesAmount,
      totalAmount: q.totalAmount,
      currency: q.currency,
      breakdown: q.breakdown,
      softDemandLine: q.softDemandLine ?? null,
    });
  } catch (e) {
    logApiRouteError("POST /api/bookings/quote", e);
    return Response.json({ error: "Could not load quote." }, { status: 500 });
  }
}
