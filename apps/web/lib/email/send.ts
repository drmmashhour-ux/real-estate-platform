/**
 * Email automation — signup, booking, payment, deal updates, admin alerts.
 * No-op if EMAIL_PROVIDER or API key not set; integrate Resend/SendGrid when ready.
 */

import { isDemoMode } from "@/lib/demo-mode";

const EMAIL_ENABLED = Boolean(
  process.env.EMAIL_API_KEY || process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY
);

export type EmailType =
  | "signup"
  | "booking_confirmation"
  | "payment_receipt"
  | "deal_update"
  | "admin_alert_fraud"
  | "admin_alert_payment";

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  type?: EmailType;
}

/**
 * Send a single email. When no provider is configured, logs and returns without sending.
 */
export async function sendEmail(params: SendEmailParams): Promise<{ ok: boolean; error?: string }> {
  if (isDemoMode()) {
    console.info("[email] DEMO_MODE — not sending:", params.type ?? "generic", params.to, params.subject);
    return { ok: true };
  }
  if (!EMAIL_ENABLED) {
    if (process.env.NODE_ENV === "development") {
      console.info("[email] Would send:", params.type ?? "generic", params.to, params.subject);
    }
    return { ok: true };
  }
  // TODO: integrate Resend/SendGrid
  // const res = await fetch("https://api.resend.com/emails", { ... });
  console.info("[email] Send not implemented; set RESEND_API_KEY or SENDGRID_API_KEY", params.type, params.to);
  return { ok: true };
}

export async function sendSignupEmail(to: string, name: string | null): Promise<{ ok: boolean }> {
  return sendEmail({
    to,
    type: "signup",
    subject: "Welcome to LECIPM",
    html: `<p>Hi ${name || "there"},</p><p>Thanks for signing up. You can now browse and book properties.</p>`,
  });
}

/** After client signup — confirm email before first sign-in (USER accounts). */
/** 6-digit login code; expires in 5 minutes (enforced in DB). */
export async function sendTwoFactorCodeEmail(to: string, code: string): Promise<{ ok: boolean }> {
  return sendEmail({
    to,
    type: "signup",
    subject: "LECIPM — your sign-in code",
    html: `<p>Your verification code is:</p>
<p style="font-size:22px;font-weight:bold;letter-spacing:0.2em;font-family:monospace;">${code}</p>
<p style="color:#737373;font-size:12px;">This code expires in 5 minutes. If you did not try to sign in, ignore this email.</p>`,
  });
}

export async function sendAccountVerificationEmail(to: string, verifyUrl: string): Promise<{ ok: boolean }> {
  return sendEmail({
    to,
    type: "signup",
    subject: "LECIPM — confirm your email",
    html: `<p>Thank you for registering with LECIPM.</p>
<p>Your account has been created. Please confirm your email address to sign in, complete your profile, and use the dashboard:</p>
<p><a href="${verifyUrl}" style="color:#C9A646;font-weight:bold;">Confirm my email</a></p>
<p style="color:#737373;font-size:12px;">If the button does not work, paste this link into your browser:<br/>${verifyUrl}</p>`,
  });
}

export async function sendBookingConfirmation(
  to: string,
  bookingId: string,
  listingTitle: string,
  checkIn: string,
  checkOut: string
): Promise<{ ok: boolean }> {
  return sendEmail({
    to,
    type: "booking_confirmation",
    subject: `Booking confirmed — ${listingTitle}`,
    html: `<p>Your booking #${bookingId} is confirmed. Check-in: ${checkIn}, Check-out: ${checkOut}.</p>`,
  });
}

export async function sendPaymentReceipt(
  to: string,
  amountCents: number,
  description: string
): Promise<{ ok: boolean }> {
  return sendEmail({
    to,
    type: "payment_receipt",
    subject: "Payment receipt",
    html: `<p>We received your payment of $${(amountCents / 100).toFixed(2)}: ${description}</p>`,
  });
}

export async function sendDealUpdate(
  to: string,
  dealId: string,
  message: string
): Promise<{ ok: boolean }> {
  return sendEmail({
    to,
    type: "deal_update",
    subject: "Deal update",
    html: `<p>Deal #${dealId}: ${message}</p>`,
  });
}

export async function sendAdminAlertFraud(subject: string, body: string): Promise<{ ok: boolean }> {
  const adminEmail = process.env.ADMIN_ALERT_EMAIL;
  if (!adminEmail) return { ok: true };
  return sendEmail({
    to: adminEmail,
    type: "admin_alert_fraud",
    subject: `[Fraud] ${subject}`,
    html: body,
  });
}

export async function sendAdminAlertPayment(subject: string, body: string): Promise<{ ok: boolean }> {
  const adminEmail = process.env.ADMIN_ALERT_EMAIL;
  if (!adminEmail) return { ok: true };
  return sendEmail({
    to: adminEmail,
    type: "admin_alert_payment",
    subject: `[Payment] ${subject}`,
    html: body,
  });
}
