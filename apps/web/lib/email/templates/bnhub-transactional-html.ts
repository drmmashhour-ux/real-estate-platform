import { getBrokerPhoneDisplay, getContactEmail, getSupportPhoneDisplay } from "@/lib/config/contact";
import { getPublicAppUrl } from "@/lib/config/public-app-url";

/** Shared BNHUB transactional email HTML shell (inline styles for clients). */

export function bnhubEmailShell(inner: string): string {
  const logoUrl = `${getPublicAppUrl()}/branding/bnhub-logo.png`;
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8" /></head>
<body style="margin:0;background:#0f172a;font-family:system-ui,-apple-system,sans-serif;color:#e2e8f0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0f172a;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#1e293b;border-radius:12px;border:1px solid #334155;overflow:hidden;">
        <tr><td style="padding:20px 24px;background:linear-gradient(135deg,#0a0a0a,#1e293b);">
          <img src="${logoUrl}" alt="BNHUB" width="200" height="56" style="max-width:min(100%,220px);height:auto;display:block;margin:0 0 10px 0;" />
          <div style="font-size:18px;font-weight:700;color:#f8fafc;margin-top:2px;">Short-term stays</div>
        </td></tr>
        <tr><td style="padding:24px 24px 28px;">${inner}</td></tr>
        <tr><td style="padding:12px 24px 20px;border-top:1px solid #334155;font-size:11px;color:#64748b;line-height:1.6;">
          You received this automated message from <strong style="color:#94a3b8;">LECIPM</strong> · BNHUB. Please do not reply with payment or card details.
          <br /><span style="color:#64748b;">Support: ${getSupportPhoneDisplay()} · Broker: ${getBrokerPhoneDisplay()} · ✉️ <a href="mailto:${getContactEmail()}" style="color:#94a3b8;">${getContactEmail()}</a></span>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export function guestBookingConfirmedHtml(opts: {
  listingTitle: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  total: string;
  confirmationCode: string;
  bookingUrl: string;
  invoicePdfUrl: string;
  /** Full URL to the “find reservation by code” page (guest signs in, then returns to booking). */
  findReservationUrl: string;
}): string {
  const inner = `
    <h1 style="margin:0 0 8px;font-size:20px;color:#f8fafc;">Booking confirmed</h1>
    <p style="margin:0 0 16px;color:#94a3b8;font-size:14px;line-height:1.5;">Hi ${escapeHtml(
      opts.guestName || "there"
    )}, your reservation is confirmed.</p>
    <div style="background:#0f172a;border-radius:10px;padding:14px 16px;border:1px solid #334155;margin-bottom:16px;">
      <p style="margin:0 0 6px;font-weight:600;color:#fbbf24;font-size:13px;">Confirmation code</p>
      <p style="margin:0;font-family:ui-monospace,monospace;font-size:18px;color:#fde68a;">${escapeHtml(
        opts.confirmationCode
      )}</p>
      <p style="margin:10px 0 0;font-size:12px;color:#94a3b8;line-height:1.5;">Save this code. After you sign in, you can reopen your trip anytime from <a href="${opts.findReservationUrl}" style="color:#fde68a;">Find my reservation</a> — enter the code above to continue to your booking.</p>
    </div>
    <p style="margin:0 0 6px;font-size:14px;color:#cbd5e1;"><strong>${escapeHtml(opts.listingTitle)}</strong></p>
    <p style="margin:0 0 16px;font-size:13px;color:#94a3b8;">${escapeHtml(opts.checkIn)} → ${escapeHtml(opts.checkOut)}</p>
    <p style="margin:0 0 16px;font-size:14px;color:#e2e8f0;">Total charged: <strong>${escapeHtml(opts.total)}</strong></p>
    <p style="margin:0 0 16px;">
      <a href="${opts.bookingUrl}" style="display:inline-block;background:#10b981;color:#042f2e;text-decoration:none;font-weight:700;font-size:14px;padding:12px 20px;border-radius:10px;margin-right:8px;">View booking</a>
      <a href="${opts.invoicePdfUrl}" style="display:inline-block;background:#b45309;color:#fffbeb;text-decoration:none;font-weight:700;font-size:14px;padding:12px 20px;border-radius:10px;">Download invoice (PDF)</a>
    </p>
    <div style="background:#0c4a6e33;border-radius:10px;padding:12px 14px;border:1px solid #334155;margin-bottom:0;">
      <p style="margin:0;font-size:12px;color:#cbd5e1;line-height:1.55;"><strong style="color:#fde68a;">Prestige stays loyalty</strong> — when you complete stays while signed in, you earn tier benefits on future BNHUB bookings. Open your account after check-out to see your status in the header.</p>
    </div>
  `;
  return bnhubEmailShell(inner);
}

export function guestPaymentReceiptHtml(opts: {
  total: string;
  confirmationCode: string;
  invoicePdfUrl: string;
  stripeReceiptUrl?: string | null;
  findReservationUrl?: string;
}): string {
  const findLine =
    opts.findReservationUrl != null && opts.findReservationUrl.length > 0
      ? `<p style="margin:0 0 16px;font-size:13px;color:#94a3b8;line-height:1.5;">Need the booking page again? <a href="${opts.findReservationUrl}" style="color:#fde68a;">Find my reservation</a> with code <strong style="color:#fde68a;font-family:ui-monospace,monospace;">${escapeHtml(
          opts.confirmationCode
        )}</strong>.</p>`
      : "";
  const inner = `
    <h1 style="margin:0 0 8px;font-size:20px;color:#f8fafc;">Receipt & invoice</h1>
    <p style="margin:0 0 16px;color:#94a3b8;font-size:14px;line-height:1.5;">Your payment was successful. Code: <strong style="color:#fde68a;">${escapeHtml(
      opts.confirmationCode
    )}</strong></p>
    ${findLine}
    <p style="margin:0 0 16px;font-size:14px;color:#e2e8f0;">Amount paid: <strong>${escapeHtml(opts.total)}</strong></p>
    <p style="margin:0 0 12px;">
      <a href="${opts.invoicePdfUrl}" style="display:inline-block;background:#f59e0b;color:#1c1917;text-decoration:none;font-weight:700;font-size:14px;padding:12px 20px;border-radius:10px;">Download invoice (PDF)</a>
    </p>
    ${
      opts.stripeReceiptUrl
        ? `<p style="margin:12px 0 0;"><a href="${opts.stripeReceiptUrl}" style="color:#34d399;font-size:13px;">Stripe receipt</a></p>`
        : ""
    }
  `;
  return bnhubEmailShell(inner);
}

export function hostNewBookingAlertHtml(opts: {
  listingTitle: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  payoutEstimate: string;
  platformFee: string;
  bookingUrl: string;
}): string {
  const inner = `
    <h1 style="margin:0 0 8px;font-size:20px;color:#f8fafc;">New paid booking</h1>
    <p style="margin:0 0 16px;color:#94a3b8;font-size:14px;line-height:1.5;">You have a new confirmed reservation.</p>
    <p style="margin:0 0 6px;font-size:14px;color:#cbd5e1;"><strong>${escapeHtml(opts.listingTitle)}</strong></p>
    <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;">Guest: ${escapeHtml(opts.guestName || "Guest")}</p>
    <p style="margin:0 0 16px;font-size:13px;color:#94a3b8;">${escapeHtml(opts.checkIn)} → ${escapeHtml(opts.checkOut)}</p>
    <div style="background:#0f172a;border-radius:10px;padding:14px 16px;border:1px solid #334155;margin-bottom:16px;">
      <p style="margin:0 0 6px;font-size:13px;color:#94a3b8;">Estimated host payout (after platform fee)</p>
      <p style="margin:0;font-size:18px;font-weight:700;color:#6ee7b7;">${escapeHtml(opts.payoutEstimate)}</p>
      <p style="margin:8px 0 0;font-size:12px;color:#64748b;">Platform commission (BNHUB): ${escapeHtml(opts.platformFee)}</p>
    </div>
    <a href="${opts.bookingUrl}" style="display:inline-block;background:#10b981;color:#042f2e;text-decoration:none;font-weight:700;font-size:14px;padding:12px 20px;border-radius:10px;">Open reservation</a>
  `;
  return bnhubEmailShell(inner);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
