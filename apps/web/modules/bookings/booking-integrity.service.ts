/**
 * BNHub booking + payment consistency checks (application layer — not Postgres RLS).
 */
import { BookingStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export type BookingIntegrityResult =
  | { ok: true; bookingId: string }
  | { ok: false; bookingId: string | null; issues: string[] };

/**
 * Verifies booking ↔ listing ↔ guest ↔ payment invariants after a successful pay flow.
 */
export async function verifyBookingIntegrity(bookingId: string): Promise<BookingIntegrityResult> {
  const issues: string[] = [];

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      payment: true,
      listing: { select: { id: true, listingStatus: true } },
      guest: { select: { id: true } },
    },
  });

  if (!booking) {
    return { ok: false, bookingId: null, issues: ["booking_not_found"] };
  }

  if (!booking.listing) {
    issues.push("listing_missing");
  }

  if (booking.checkOut.getTime() <= booking.checkIn.getTime()) {
    issues.push("invalid_date_range");
  }

  if (booking.nights < 1) {
    issues.push("invalid_nights");
  }

  if (!booking.payment) {
    issues.push("payment_row_missing");
  } else {
    const pay = booking.payment;
    if (pay.amountCents < 1) {
      issues.push("payment_amount_invalid");
    }
    if (pay.status === PaymentStatus.COMPLETED && !pay.stripePaymentId?.trim()) {
      issues.push("payment_completed_missing_stripe_payment_id");
    }
  }

  if (booking.status === BookingStatus.CONFIRMED && !booking.payment) {
    issues.push("confirmed_without_payment");
  }

  if (booking.guestId !== booking.guest?.id) {
    issues.push("guest_relation_mismatch");
  }

  return issues.length === 0 ? { ok: true, bookingId } : { ok: false, bookingId, issues };
}
