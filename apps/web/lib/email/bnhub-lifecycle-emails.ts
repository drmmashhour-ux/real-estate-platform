/**
 * BNHub booking lifecycle emails after Stripe payment completes.
 * Fire-and-forget from webhook; failures must not affect booking state.
 */

import { prisma } from "@/lib/db";
import { logInfo, logError } from "@/lib/logger";
import { recordPlatformEvent } from "@/lib/observability";
import { sendTransactionalEmail } from "@/lib/email/provider";
import {
  guestBookingConfirmedHtml,
  guestPaymentReceiptHtml,
  hostNewBookingAlertHtml,
} from "@/lib/email/templates/bnhub-transactional-html";

function appOrigin(): string {
  const u = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (u) return u;
  return "http://localhost:3000";
}

function fmtMoney(cents: number, currency = "CAD"): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(cents / 100);
}

/**
 * Sends guest confirmation, guest receipt/invoice, and host alert when not already sent.
 */
export async function sendBnhubPostPaymentEmails(bookingId: string): Promise<void> {
  let booking;
  try {
    booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        guest: { select: { email: true, name: true } },
        listing: { select: { title: true, ownerId: true, owner: { select: { email: true, name: true } } } },
        payment: true,
        bnhubInvoice: true,
      },
    });
  } catch (e) {
    logError("bnhub_email_load_booking", e);
    return;
  }

  if (!booking?.payment || booking.payment.status !== "COMPLETED") {
    logInfo("bnhub_email_skip", { bookingId, reason: "payment_not_completed" });
    return;
  }

  const code =
    booking.confirmationCode ?? booking.bnhubInvoice?.confirmationCode ?? bookingId.slice(0, 8).toUpperCase();
  const origin = appOrigin();
  const bookingUrl = `${origin}/bnhub/booking/${bookingId}`;
  const invoicePdfUrl = `${origin}/api/booking/${bookingId}/invoice/pdf`;
  const checkIn = new Date(booking.checkIn).toLocaleString();
  const checkOut = new Date(booking.checkOut).toLocaleString();
  const totalCents = booking.payment.stripeCheckoutAmountCents ?? booking.payment.amountCents;
  const totalStr = fmtMoney(totalCents, (booking.payment.stripeCheckoutCurrency ?? "cad").toUpperCase());
  const hostPayoutCents = booking.payment.hostPayoutCents ?? 0;
  const platformFeeCents = booking.payment.platformFeeCents ?? 0;
  const payoutStr = fmtMoney(hostPayoutCents);
  const feeStr = fmtMoney(platformFeeCents);

  const guestEmail = booking.guest.email?.trim();
  const hostEmail = booking.listing.owner?.email?.trim();

  const updates: Record<string, Date> = {};

  if (guestEmail && !booking.guestConfirmationEmailSentAt) {
    const ok = await sendTransactionalEmail({
      to: guestEmail,
      subject: `Booking confirmed`,
      template: "bnhub_guest_confirmed",
      html: guestBookingConfirmedHtml({
        listingTitle: booking.listing.title,
        guestName: booking.guest.name ?? "",
        checkIn,
        checkOut,
        total: totalStr,
        confirmationCode: code,
        bookingUrl,
        invoicePdfUrl,
      }),
    });
    if (ok) updates.guestConfirmationEmailSentAt = new Date();
    void recordPlatformEvent({
      eventType: "email_sent",
      sourceModule: "email",
      entityType: "BOOKING",
      entityId: bookingId,
      payload: { template: "bnhub_guest_confirmed", ok },
    }).catch(() => {});
  }

  if (guestEmail && !booking.guestInvoiceEmailSentAt) {
    const ok = await sendTransactionalEmail({
      to: guestEmail,
      subject: `Receipt & invoice — ${code}`,
      template: "bnhub_guest_invoice",
      html: guestPaymentReceiptHtml({
        total: totalStr,
        confirmationCode: code,
        invoicePdfUrl,
        stripeReceiptUrl: booking.payment.stripeReceiptUrl,
      }),
    });
    if (ok) updates.guestInvoiceEmailSentAt = new Date();
    void recordPlatformEvent({
      eventType: "email_sent",
      sourceModule: "email",
      entityType: "BOOKING",
      entityId: bookingId,
      payload: { template: "bnhub_guest_invoice", ok },
    }).catch(() => {});
  }

  if (hostEmail && !booking.hostBookingAlertEmailSentAt) {
    const ok = await sendTransactionalEmail({
      to: hostEmail,
      subject: `New booking received`,
      template: "bnhub_host_booking_alert",
      html: hostNewBookingAlertHtml({
        listingTitle: booking.listing.title,
        guestName: booking.guest.name ?? "",
        checkIn,
        checkOut,
        payoutEstimate: payoutStr,
        platformFee: feeStr,
        bookingUrl,
      }),
    });
    if (ok) updates.hostBookingAlertEmailSentAt = new Date();
    void recordPlatformEvent({
      eventType: "email_sent",
      sourceModule: "email",
      entityType: "BOOKING",
      entityId: bookingId,
      payload: { template: "bnhub_host_booking_alert", ok },
    }).catch(() => {});
  }

  if (Object.keys(updates).length > 0) {
    try {
      await prisma.booking.update({
        where: { id: bookingId },
        data: updates,
      });
      logInfo("bnhub_email_booking_updated", { bookingId, fields: Object.keys(updates) });
    } catch (e) {
      logError("bnhub_email_booking_update_failed", e);
    }
  }
}
