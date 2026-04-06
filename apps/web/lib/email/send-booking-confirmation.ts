/**
 * Guest booking paid confirmation (Resend). Re-exported from `@/lib/notifications/booking-emails` for the notification layer.
 */
import { logInfo } from "@/lib/logger";
import { getNotificationEmail, isResendConfigured, sendEmail } from "@/lib/email/resend";

export type BookingConfirmationEmailParams = {
  bookingId: string;
  listingTitle: string;
  /** Human-readable total, e.g. "129.00 CAD" */
  totalDisplay: string;
  /** Short summary of stay dates (JSON array or prose) */
  datesSummary: string;
  /** Guest email from `bookings.guest_email` when present */
  guestEmail?: string | null;
  /** Nightly count from `dates` array length when known */
  nightsCount?: number | null;
  /** ISO currency code from Stripe session, e.g. CAD */
  currency?: string | null;
  stripeCheckoutSessionId?: string | null;
  stripePaymentIntentId?: string | null;
};

/**
 * Guest BNHub: sends guest receipt (if email on file) + internal ops copy when Resend is configured.
 * TODO: Restrict guest body for CAN-SPAM / locale; wire BNHUB_BOOKING_CONFIRMATION_TO override.
 */
export async function sendBookingConfirmationEmail(params: BookingConfirmationEmailParams): Promise<void> {
  const {
    bookingId,
    listingTitle,
    totalDisplay,
    datesSummary,
    guestEmail,
    nightsCount,
    currency,
    stripeCheckoutSessionId,
    stripePaymentIntentId,
  } = params;

  if (!isResendConfigured()) {
    logInfo("[email] booking confirmation skipped — Resend not configured", {
      bookingId,
      listingTitle,
      totalDisplay,
    });
    return;
  }

  const ops = getNotificationEmail();
  const guestTo = guestEmail?.trim() ?? "";
  const guestOk = guestTo.includes("@");
  const nightsLine =
    typeof nightsCount === "number" && nightsCount >= 0
      ? `<li><strong>Nights:</strong> ${escapeHtml(String(nightsCount))}</li>`
      : "";
  const currencyLine = currency?.trim() ? `<li><strong>Currency:</strong> ${escapeHtml(currency.trim())}</li>` : "";
  const stripeMetaOps =
    stripeCheckoutSessionId || stripePaymentIntentId
      ? `<li><strong>Stripe session:</strong> ${escapeHtml(stripeCheckoutSessionId ?? "—")}</li><li><strong>Payment intent:</strong> ${escapeHtml(stripePaymentIntentId ?? "—")}</li>`
      : "";

  const guestSummaryLines = `
    <ul>
      <li><strong>Booking ID:</strong> ${escapeHtml(bookingId)}</li>
      <li><strong>Listing:</strong> ${escapeHtml(listingTitle)}</li>
      <li><strong>Total:</strong> ${escapeHtml(totalDisplay)}</li>
      ${nightsLine}
      ${currencyLine}
      <li><strong>Dates:</strong> ${escapeHtml(datesSummary)}</li>
    </ul>`;

  const opsSummaryLines = `
    <ul>
      <li><strong>Booking ID:</strong> ${escapeHtml(bookingId)}</li>
      <li><strong>Listing:</strong> ${escapeHtml(listingTitle)}</li>
      <li><strong>Total:</strong> ${escapeHtml(totalDisplay)}</li>
      ${nightsLine}
      ${currencyLine}
      <li><strong>Dates:</strong> ${escapeHtml(datesSummary)}</li>
      ${stripeMetaOps}
    </ul>`;

  if (guestOk) {
    const guestSubject = `Your BNHub stay is confirmed — ${listingTitle.replace(/[\r\n]/g, " ").slice(0, 80)}`;
    const guestHtml = `
      <p>Thank you — your payment was received.</p>
      ${guestSummaryLines}
      <p style="color:#666;font-size:12px;">LECIPM BNHub · This email was sent because you booked a stay on our platform.</p>
    `;
    await sendEmail({ to: guestTo, subject: guestSubject, html: guestHtml });
  }

  if (ops.includes("@")) {
    const opsSubject = `BNHub booking paid — ${listingTitle}`;
    const opsHtml = `
      <p>A guest booking was marked <strong>paid</strong> in Supabase.</p>
      ${opsSummaryLines}
      ${guestOk ? `<p><strong>Guest email on file:</strong> ${escapeHtml(guestTo)}</p>` : "<p><em>No guest email on this booking row.</em></p>"}
      <p style="color:#666;font-size:12px;">Automated message from LECIPM BNHub webhook.</p>
    `;
    await sendEmail({ to: ops, subject: opsSubject, html: opsHtml });
  } else {
    logInfo("[email] booking confirmation: no ops recipient", { bookingId });
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
