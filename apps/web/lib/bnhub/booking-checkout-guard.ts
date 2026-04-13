/**
 * Server-side rules for BNHUB booking checkout and Stripe webhook completion.
 * Payment confirmation must only happen via Stripe webhook after a valid checkout session.
 */

import { prisma } from "@/lib/db";
import { evaluateGuestCheckout } from "@/lib/bnhub/bnhub-safety-rules";

export type BookingCheckoutGate =
  | { ok: true; amountCents: number }
  | { ok: false; httpStatus: 403 | 400 | 404 | 409; error: string };

/**
 * Ensures the signed-in guest may start checkout: booking exists, is PENDING, payment PENDING.
 * Returns the authoritative amount to charge (never trust client-supplied cents for bookings).
 */
export async function assertGuestCanCheckoutBooking(
  bookingId: string,
  guestUserId: string
): Promise<BookingCheckoutGate> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      payment: true,
      listing: {
        select: { securityDepositCents: true, verificationStatus: true },
      },
    },
  });
  if (!booking?.payment) {
    return { ok: false, httpStatus: 404, error: "Booking not found" };
  }
  if (booking.guestId !== guestUserId) {
    return { ok: false, httpStatus: 403, error: "Not allowed to pay for this booking" };
  }
  if (booking.status !== "PENDING") {
    return { ok: false, httpStatus: 400, error: "Booking is not awaiting payment" };
  }
  if (booking.payment.status !== "PENDING") {
    return { ok: false, httpStatus: 400, error: "Payment already processed" };
  }
  const exp = booking.pendingCheckoutExpiresAt;
  if (exp && exp.getTime() < Date.now()) {
    return { ok: false, httpStatus: 409, error: "Checkout window expired. Start a new booking." };
  }

  const fraud = await prisma.propertyFraudScore.findUnique({
    where: { listingId: booking.listingId },
    select: { fraudScore: true },
  });
  const checkoutTrust = evaluateGuestCheckout(booking.listing, fraud);
  if (!checkoutTrust.ok) {
    return { ok: false, httpStatus: 403, error: checkoutTrust.error };
  }

  return { ok: true, amountCents: booking.payment.amountCents };
}

export type BookingWebhookGate = { ok: true } | { ok: false; reason: string };

/**
 * Webhook-only: metadata user must be the guest, amounts must match DB, booking/payment still pending.
 * If this fails, we acknowledge Stripe but do not record platform payment or confirm the booking.
 */
export async function assertBookingStripeWebhookValid(params: {
  bookingId: string;
  metadataUserId: string;
  amountTotalCents: number;
}): Promise<BookingWebhookGate> {
  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
    include: { payment: true },
  });
  if (!booking?.payment) {
    return { ok: false, reason: "booking_not_found" };
  }
  if (booking.guestId !== params.metadataUserId) {
    return { ok: false, reason: "guest_mismatch" };
  }
  if (booking.status !== "PENDING") {
    return { ok: false, reason: "booking_not_pending" };
  }
  if (booking.payment.status !== "PENDING") {
    return { ok: false, reason: "payment_not_pending" };
  }
  const exp = booking.pendingCheckoutExpiresAt;
  if (exp && exp.getTime() < Date.now()) {
    return { ok: false, reason: "checkout_expired" };
  }
  const delta = Math.abs(booking.payment.amountCents - params.amountTotalCents);
  /** Allow 1¢ drift for Stripe minor-unit rounding vs our quote snapshot. */
  if (delta > 1) {
    return { ok: false, reason: "amount_mismatch" };
  }
  return { ok: true };
}
