/**
 * Stripe refund for BNHub `Payment` linked to a booking (PaymentIntent id on `stripePaymentId`).
 */

import Stripe from "stripe";
import { PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { logInfo } from "@/lib/logger";
import { releaseBookedSlotsForBooking } from "@/lib/bnhub/availability-day-helpers";

export type RefundBnhubBookingResult =
  | { ok: true; refundId: string; status: PaymentStatus; bookingStatus?: string }
  | { ok: false; error: string; httpStatus: number };

export async function refundBnhubBookingPayment(params: {
  bookingId: string;
  amountCents?: number;
  reason?: string | null;
}): Promise<RefundBnhubBookingResult> {
  const stripe = getStripe();
  if (!stripe) {
    return { ok: false, error: "Stripe is not configured.", httpStatus: 503 };
  }

  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
    include: { payment: true },
  });
  if (!booking?.payment) {
    return { ok: false, error: "Booking or payment not found.", httpStatus: 404 };
  }

  const pay = booking.payment;
  if (pay.status !== PaymentStatus.COMPLETED && pay.status !== PaymentStatus.PARTIALLY_REFUNDED) {
    return { ok: false, error: "Payment is not in a refundable state.", httpStatus: 409 };
  }

  const piId = pay.stripePaymentId?.trim();
  if (!piId || !piId.startsWith("pi_")) {
    return { ok: false, error: "No Stripe payment intent on file for this booking.", httpStatus: 409 };
  }

  const totalPaid = pay.amountCents;
  const partial =
    typeof params.amountCents === "number" && Number.isFinite(params.amountCents) && params.amountCents > 0
      ? Math.min(Math.round(params.amountCents), totalPaid)
      : totalPaid;

  let refund: Stripe.Refund;
  try {
    refund = await stripe.refunds.create({
      payment_intent: piId,
      amount: partial < totalPaid ? partial : undefined,
      metadata: {
        bookingId: params.bookingId,
        reason: params.reason?.slice(0, 200) ?? "",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Refund failed";
    return { ok: false, error: msg, httpStatus: 502 };
  }

  const isFull = partial >= totalPaid;
  const nextPayStatus = isFull ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED;

  await prisma.payment.update({
    where: { id: pay.id },
    data: {
      status: nextPayStatus,
      stripeLastRefundId: refund.id,
    },
  });

  let bookingStatus = booking.status;
  if (isFull) {
    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: params.bookingId },
        data: {
          status: "CANCELLED",
          cancellationReason: params.reason?.trim() || "Refund issued",
          canceledAt: new Date(),
        },
      });
      await releaseBookedSlotsForBooking(tx, params.bookingId);
    });
    bookingStatus = "CANCELLED";
  }

  logInfo("[booking/refund] stripe refund created", {
    bookingId: params.bookingId,
    refundId: refund.id,
    amountCents: partial,
    paymentStatus: nextPayStatus,
  });

  return { ok: true, refundId: refund.id, status: nextPayStatus, bookingStatus };
}
