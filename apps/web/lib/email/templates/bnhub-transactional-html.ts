import { getBrokerPhoneDisplay, getContactEmail, getSupportPhoneDisplay } from "@/lib/config/contact";

/** Shared BNHub transactional email HTML shell (inline styles for clients). */

export function bnhubEmailShell(inner: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8" /></head>
<body style="margin:0;background:#0f172a;font-family:system-ui,-apple-system,sans-serif;color:#e2e8f0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0f172a;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#1e293b;border-radius:12px;border:1px solid #334155;overflow:hidden;">
        <tr><td style="padding:20px 24px;background:linear-gradient(135deg,#059669,#0d9488);">
          <div style="font-size:11px;font-weight:600;letter-spacing:0.15em;color:rgba(255,255,255,0.85);">BNHUB</div>
          <div style="font-size:18px;font-weight:700;color:#fff;margin-top:4px;">Short-term stays</div>
        </td></tr>
        <tr><td style="padding:24px 24px 28px;">${inner}</td></tr>
        <tr><td style="padding:12px 24px 20px;border-top:1px solid #334155;font-size:11px;color:#64748b;line-height:1.6;">
          You received this automated message from <strong style="color:#94a3b8;">LECIPM</strong> · BNHub. Please do not reply with payment or card details.
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
    </div>
    <p style="margin:0 0 6px;font-size:14px;color:#cbd5e1;"><strong>${escapeHtml(opts.listingTitle)}</strong></p>
    <p style="margin:0 0 16px;font-size:13px;color:#94a3b8;">${escapeHtml(opts.checkIn)} → ${escapeHtml(opts.checkOut)}</p>
    <p style="margin:0 0 16px;font-size:14px;color:#e2e8f0;">Total charged: <strong>${escapeHtml(opts.total)}</strong></p>
    <p style="margin:0 0 16px;">
      <a href="${opts.bookingUrl}" style="display:inline-block;background:#10b981;color:#042f2e;text-decoration:none;font-weight:700;font-size:14px;padding:12px 20px;border-radius:10px;margin-right:8px;">View booking</a>
      <a href="${opts.invoicePdfUrl}" style="display:inline-block;background:#b45309;color:#fffbeb;text-decoration:none;font-weight:700;font-size:14px;padding:12px 20px;border-radius:10px;">Download invoice (PDF)</a>
    </p>
  `;
  return bnhubEmailShell(inner);
}

export function guestPaymentReceiptHtml(opts: {
  total: string;
  confirmationCode: string;
  invoicePdfUrl: string;
  stripeReceiptUrl?: string | null;
}): string {
  const inner = `
    <h1 style="margin:0 0 8px;font-size:20px;color:#f8fafc;">Receipt & invoice</h1>
    <p style="margin:0 0 16px;color:#94a3b8;font-size:14px;line-height:1.5;">Your payment was successful. Code: <strong style="color:#fde68a;">${escapeHtml(
      opts.confirmationCode
    )}</strong></p>
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
      <p style="margin:8px 0 0;font-size:12px;color:#64748b;">Platform commission (BNHub): ${escapeHtml(opts.platformFee)}</p>
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
