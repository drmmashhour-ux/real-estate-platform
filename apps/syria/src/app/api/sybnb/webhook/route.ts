import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { trackSyriaGrowthEvent } from "@/lib/growth-events";
import { revalidateSyriaPaths } from "@/lib/revalidate-locale";

/**
 * Stub Stripe webhook — no signature verification against Stripe until a PSP is legally enabled.
 * Expects JSON: `{ "type": "checkout.session.completed", "data": { "object": { "metadata": { "bookingId": "..." } } } }`
 * or `{ "bookingId": "..." }` for local testing.
 * Set `SYBNB_STRIPE_WEBHOOK_SECRET` and send header `x-sybnb-webhook-secret` with the same value.
 */
export async function POST(req: Request): Promise<Response> {
  const secret = process.env.SYBNB_STRIPE_WEBHOOK_SECRET?.trim();
  if (secret) {
    const sent = req.headers.get("x-sybnb-webhook-secret");
    if (sent !== secret) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const o = body as Record<string, unknown>;
  let bookingId = "";
  const type = typeof o.type === "string" ? o.type : "";
  if (type === "checkout.session.completed" && o.data && typeof o.data === "object") {
    const data = o.data as Record<string, unknown>;
    const obj = data.object && typeof data.object === "object" ? (data.object as Record<string, unknown>) : null;
    const meta = obj?.metadata && typeof obj.metadata === "object" ? (obj.metadata as Record<string, unknown>) : null;
    bookingId = typeof meta?.bookingId === "string" ? meta.bookingId : "";
  }
  if (!bookingId && typeof o.bookingId === "string") {
    bookingId = o.bookingId;
  }
  if (!bookingId.trim()) {
    return NextResponse.json({ error: "missing_booking_id" }, { status: 400 });
  }

  const booking = await prisma.syriaBooking.findUnique({
    where: { id: bookingId.trim() },
    include: { property: { include: { owner: true } } },
  });
  if (!booking || booking.property.category !== "stay") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (booking.status !== "APPROVED" || booking.guestPaymentStatus !== "UNPAID") {
    return NextResponse.json({ error: "invalid_state" }, { status: 409 });
  }
  if (evaluateSybnbStayRequestEligibility(booking.property, booking.property.owner).ok !== true) {
    return NextResponse.json({ error: "listing_or_host_blocked" }, { status: 409 });
  }
  if (!sybnbBookingRowMatchesServerQuote(booking, booking.property)) {
    return NextResponse.json({ error: "amount_mismatch" }, { status: 409 });
  }

  await prisma.syriaBooking.update({
    where: { id: booking.id },
    data: {
      status: "CONFIRMED",
      guestPaymentStatus: "PAID",
    },
  });

  await trackSyriaGrowthEvent({
    eventType: "sybnb_checkout_webhook_paid",
    userId: booking.guestId,
    propertyId: booking.propertyId,
    bookingId: booking.id,
    payload: { source: "sybnb_webhook_stub" },
  });

  await revalidateSyriaPaths("/dashboard/bookings", "/admin/bookings", "/sybnb", `/listing/${booking.propertyId}`);

  return NextResponse.json({ ok: true, received: true });
}
