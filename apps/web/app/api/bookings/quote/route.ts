import { NextRequest } from "next/server";
import { calculateBookingQuote } from "@/lib/bookings/calculateBookingQuote";
import { getGuestId } from "@/lib/auth/session";
import { logInfo } from "@/lib/logger";
import { logApiRouteError } from "@/lib/api/dev-log";
import { calculateDynamicTotal } from "@/lib/pricing/calculateDynamicTotal";
import { getBookingPriceBreakdown } from "@/lib/booking/pricing";
import { trackEvent } from "@/src/services/analytics";

export const dynamic = "force-dynamic";

/**
 * GET /api/bookings/quote?listingId=&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD — **marketplace** dynamic
 * nightly total (Order 61). No BNHub short-term path.
 */
export async function GET(request: NextRequest) {
  const u = new URL(request.url);
  const listingId = u.searchParams.get("listingId")?.trim() ?? "";
  const startDate = u.searchParams.get("startDate")?.trim() ?? u.searchParams.get("checkIn")?.trim() ?? "";
  const endDate = u.searchParams.get("endDate")?.trim() ?? u.searchParams.get("checkOut")?.trim() ?? "";
  if (!listingId || !startDate || !endDate) {
    return Response.json(
      { error: "listingId, startDate, and endDate (or checkIn / checkOut) are required" },
      { status: 400 }
    );
  }
  if (endDate <= startDate) {
    return Response.json({ error: "endDate must be after startDate" }, { status: 400 });
  }
  try {
    const d = await calculateDynamicTotal({ listingId, startDate, endDate });
    if (!d) {
      return Response.json({ error: "Could not load quote" }, { status: 400 });
    }
    const br = await getBookingPriceBreakdown({ listingId, startDate, endDate });
    void trackEvent("dynamic_quote_viewed", {
      listingId,
      nights: d.nights,
      subtotalCents: d.subtotalCents,
      finalCents: d.finalCents,
    }).catch(() => {});
    return Response.json({
      ok: true,
      breakdown: {
        nights: d.nights,
        nightlyPrices: d.nightlyPrices,
        allNightsAvailable: br?.allNightsAvailable ?? true,
        subtotalCents: d.subtotalCents,
        platformFeeCents: d.platformFeeCents,
        finalCents: d.finalCents,
      },
    });
  } catch (e) {
    logApiRouteError("GET /api/bookings/quote (marketplace)", e);
    return Response.json({ error: "Could not load quote" }, { status: 500 });
  }
}

/**
 * POST /api/bookings/quote — BNHub monolith: live price preview only (no booking row).
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
