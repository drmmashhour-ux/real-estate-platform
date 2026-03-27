import {
  BnhubMpCaptureMode,
  BnhubMpFundsFlow,
  BnhubMpLedgerDirection,
  BnhubMpLedgerEntity,
  BnhubMpPaymentEventActor,
  BnhubMpProcessor,
  BnhubMpReservationPaymentStatus,
  BnhubMpRiskHold,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { createQuoteSnapshot, computeReservationQuoteFromBooking } from "@/modules/bnhub-payments/services/paymentQuoteService";
import {
  appendLedgerEntry,
  logPaymentEvent,
} from "@/modules/bnhub-payments/services/financeAuditService";
import { createPendingPayoutAfterGuestPaid } from "@/modules/bnhub-payments/services/payoutControlService";

export type PrepareCheckoutResult =
  | { ok: true; reservationPaymentId: string; quoteId: string }
  | { ok: false; error: string; httpStatus?: number };

/**
 * Creates/updates marketplace payment row + quote; enforces server-side total vs `payments.amount_cents`.
 */
export async function prepareReservationPaymentForCheckout(params: {
  bookingId: string;
  guestUserId: string;
}): Promise<PrepareCheckoutResult> {
  const quote = await computeReservationQuoteFromBooking(params.bookingId);
  if (!quote.ok) return { ok: false, error: quote.error, httpStatus: 404 };

  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
    include: { payment: true },
  });
  if (!booking?.payment) return { ok: false, error: "Booking not found", httpStatus: 404 };
  if (booking.guestId !== params.guestUserId) {
    return { ok: false, error: "Not allowed", httpStatus: 403 };
  }

  if (booking.payment.amountCents !== quote.grandTotalCents) {
    return {
      ok: false,
      error: "Payment amount out of sync with server quote; refresh and try again.",
      httpStatus: 409,
    };
  }

  const existing = await prisma.bnhubReservationPayment.findUnique({
    where: { bookingId: params.bookingId },
  });
  if (
    existing &&
    (existing.paymentStatus === BnhubMpReservationPaymentStatus.PAID ||
      existing.paymentStatus === BnhubMpReservationPaymentStatus.AUTHORIZED)
  ) {
    return { ok: false, error: "Marketplace payment already completed", httpStatus: 400 };
  }

  const snap = await createQuoteSnapshot({
    bookingId: params.bookingId,
    listingId: quote.listingId,
    guestUserId: quote.guestUserId,
    hostUserId: quote.hostUserId,
    breakdown: quote.breakdown,
    currency: quote.currency,
  });

  const idempotencyKey = `bnhub_mp_checkout:${params.bookingId}`;

  const row = await prisma.bnhubReservationPayment.upsert({
    where: { bookingId: params.bookingId },
    create: {
      bookingId: params.bookingId,
      paymentQuoteId: snap.id,
      guestUserId: quote.guestUserId,
      hostUserId: quote.hostUserId,
      listingId: quote.listingId,
      processor: BnhubMpProcessor.STRIPE,
      currency: quote.currency.toLowerCase(),
      paymentStatus: BnhubMpReservationPaymentStatus.REQUIRES_ACTION,
      captureMode: BnhubMpCaptureMode.AUTOMATIC,
      fundsFlow: BnhubMpFundsFlow.DESTINATION_CHARGE,
      riskHoldStatus: BnhubMpRiskHold.NONE,
      idempotencyKey,
    },
    update: {
      paymentQuoteId: snap.id,
      guestUserId: quote.guestUserId,
      hostUserId: quote.hostUserId,
      listingId: quote.listingId,
      currency: quote.currency.toLowerCase(),
      paymentStatus: BnhubMpReservationPaymentStatus.REQUIRES_ACTION,
      processorCheckoutSessionId: null,
      processorPaymentIntentId: null,
      idempotencyKey,
    },
  });

  await logPaymentEvent(row.id, params.bookingId, "checkout_prepared", {
    quoteId: snap.id,
    grandTotalCents: quote.grandTotalCents,
  });

  return { ok: true, reservationPaymentId: row.id, quoteId: snap.id };
}

export async function attachCheckoutSessionToReservationPayment(
  reservationPaymentId: string,
  checkoutSessionId: string
) {
  await prisma.bnhubReservationPayment.update({
    where: { id: reservationPaymentId },
    data: {
      processorCheckoutSessionId: checkoutSessionId,
      paymentStatus: BnhubMpReservationPaymentStatus.PROCESSING,
    },
  });
  const row = await prisma.bnhubReservationPayment.findUnique({
    where: { id: reservationPaymentId },
    select: { bookingId: true },
  });
  if (row) {
    await logPaymentEvent(reservationPaymentId, row.bookingId, "checkout_session_created", {
      checkoutSessionId,
    });
  }
}

export type WebhookPaidPayload = {
  bookingId: string;
  reservationPaymentId?: string | null;
  sessionAmountTotalCents: number;
  currency: string;
  stripeSessionId: string;
  stripePaymentIntentId: string | null;
  legacyPaymentId: string;
  platformFeeCents: number;
  hostPayoutCents: number;
};

/**
 * Idempotent: safe if Stripe webhook retries.
 */
export async function syncReservationPaymentPaidFromWebhook(payload: WebhookPaidPayload): Promise<void> {
  const { bookingId } = payload;

  let mp = payload.reservationPaymentId
    ? await prisma.bnhubReservationPayment.findUnique({ where: { id: payload.reservationPaymentId } })
    : await prisma.bnhubReservationPayment.findUnique({ where: { bookingId } });

  if (!mp) {
    mp = await prisma.bnhubReservationPayment.findUnique({ where: { bookingId } });
  }
  if (!mp) {
    return;
  }

  if (mp.paymentStatus === BnhubMpReservationPaymentStatus.PAID) {
    return;
  }

  await prisma.bnhubReservationPayment.update({
    where: { id: mp.id },
    data: {
      legacyPaymentId: payload.legacyPaymentId,
      processorCheckoutSessionId: payload.stripeSessionId,
      processorPaymentIntentId: payload.stripePaymentIntentId,
      amountCapturedCents: payload.sessionAmountTotalCents,
      amountAuthorizedCents: payload.sessionAmountTotalCents,
      currency: payload.currency.toLowerCase(),
      paymentStatus: BnhubMpReservationPaymentStatus.PAID,
      paidAt: new Date(),
    },
  });

  await logPaymentEvent(mp.id, bookingId, "payment_captured_webhook", {
    sessionAmountTotalCents: payload.sessionAmountTotalCents,
    platformFeeCents: payload.platformFeeCents,
    hostPayoutCents: payload.hostPayoutCents,
  }, BnhubMpPaymentEventActor.WEBHOOK);

  await appendLedgerEntry({
    entityType: BnhubMpLedgerEntity.PAYMENT,
    entityId: mp.id,
    bookingId,
    userId: null,
    direction: BnhubMpLedgerDirection.CREDIT,
    amountCents: payload.sessionAmountTotalCents,
    currency: payload.currency.toLowerCase(),
    entryType: "guest_charge_settled",
    summary: "Guest payment captured (marketplace ledger)",
  });

  await createPendingPayoutAfterGuestPaid({
    reservationPaymentId: mp.id,
    bookingId,
    hostUserId: mp.hostUserId,
    listingId: mp.listingId,
    guestPaidCents: payload.sessionAmountTotalCents,
    platformFeeCents: payload.platformFeeCents,
    hostPayoutCents: payload.hostPayoutCents,
    currency: payload.currency.toLowerCase(),
  });
}

export async function markPaymentFailed(reservationPaymentId: string, reason: string) {
  const row = await prisma.bnhubReservationPayment.update({
    where: { id: reservationPaymentId },
    data: { paymentStatus: BnhubMpReservationPaymentStatus.FAILED },
  });
  await logPaymentEvent(reservationPaymentId, row.bookingId, "payment_failed", { reason });
}

export async function getGuestPaymentSummary(guestUserId: string, bookingId: string) {
  const row = await prisma.bnhubReservationPayment.findUnique({
    where: { bookingId },
    include: { paymentQuote: true },
  });
  if (!row || row.guestUserId !== guestUserId) return null;
  return {
    paymentStatus: row.paymentStatus,
    currency: row.currency,
    amountCapturedCents: row.amountCapturedCents,
    amountRefundedCents: row.amountRefundedCents,
    paidAt: row.paidAt,
    quote: row.paymentQuote
      ? {
          nightlySubtotalCents: row.paymentQuote.nightlySubtotalCents,
          cleaningFeeCents: row.paymentQuote.cleaningFeeCents,
          taxTotalCents: row.paymentQuote.taxTotalCents,
          serviceFeeCents: row.paymentQuote.serviceFeeCents,
          addOnTotalCents: row.paymentQuote.addOnTotalCents,
          grandTotalCents: row.paymentQuote.grandTotalCents,
        }
      : null,
  };
}

export async function getReservationFinancialSummaryForAdmin(bookingId: string) {
  return prisma.bnhubReservationPayment.findUnique({
    where: { bookingId },
    include: {
      paymentQuote: true,
      payouts: true,
      refunds: true,
      disputes: true,
      holds: true,
    },
  });
}
