import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { assertSybnbStripePreconditions } from "@/lib/sybnb/payment-policy";
import { buildStubPaymentIntentId } from "@/lib/sybnb/stripe-checkout-stub";

/**
 * Returns a stub id when all SYBNB payment gates pass. Live Stripe is not wired in this app until legal approval.
 * Always validate server-side; never create real PaymentIntents unless product enables env + preconditions.
 */
export async function POST(req: Request): Promise<Response> {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { bookingId?: string; idempotencyKey?: string };
  try {
    body = (await req.json()) as { bookingId?: string; idempotencyKey?: string };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const bookingId = String(body.bookingId ?? "").trim();
  if (!bookingId) {
    return NextResponse.json({ error: "missing_booking" }, { status: 400 });
  }

  const booking = await prisma.syriaBooking.findUnique({
    where: { id: bookingId },
    include: { property: { include: { owner: true } } },
  });
  if (!booking) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (booking.property.category !== "stay") {
    return NextResponse.json({ error: "not_sybnb_stay" }, { status: 400 });
  }

  const gate = assertSybnbStripePreconditions(booking.property, booking.property.owner, booking, user.id);
  if (!gate.ok) {
    return NextResponse.json(
      { error: "checkout_blocked", reason: gate.reason, detail: gate.detail },
      { status: 403 },
    );
  }

  return NextResponse.json({
    clientSecret: null,
    paymentIntentId: buildStubPaymentIntentId(booking.id),
    mode: "stub",
    message: "Stripe not activated for this region. No charge created.",
  });
}
