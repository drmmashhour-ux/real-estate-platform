/**
 * External notification channel: Resend (email) + optional Twilio (SMS) via HTTP API.
 * In-app notifications use `createNotification` elsewhere — call from the same event handler.
 *
 * Configure: RESEND_API_KEY, EMAIL_FROM, ADMIN_NOTIFY_EMAIL (optional),
 * TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, ADMIN_NOTIFY_SMS (E.164).
 */

import { sendEmail, getNotificationEmail } from "@/lib/email/resend";

import { shouldNotifyAdmin } from "./notification-ai-gate";
import type { PlatformBusinessEvent } from "./platform-events";
import { sendSmsViaTwilio } from "./sms.service";

function textToHtml(text: string): string {
  const esc = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<!doctype html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111"><pre style="white-space:pre-wrap">${esc}</pre></body></html>`;
}

/** Direct email send (maps to Resend when configured). */
export async function sendTransactionalEmail(to: string, subject: string, text: string): Promise<boolean> {
  return sendEmail({ to: to.trim(), subject, html: textToHtml(text) });
}

export type DispatchAdminNotificationInput = {
  event: PlatformBusinessEvent;
  /** Plain-text body for both channels (keep SMS under 320 chars when possible). */
  bodyText: string;
  subject?: string;
  /** Overrides ADMIN_NOTIFY_EMAIL */
  adminEmail?: string;
  /** E.164; overrides ADMIN_NOTIFY_SMS */
  adminSms?: string;
};

/**
 * Sends admin email (always when gate passes for email) and SMS when configured and gate passes for SMS.
 */
export async function dispatchAdminNotification(input: DispatchAdminNotificationInput): Promise<{
  emailOk: boolean;
  smsOk: boolean;
}> {
  const subject =
    input.subject ??
    `LECIPM · ${input.event.type.replace(/_/g, " ").toLowerCase()}`;

  const adminEmail = (input.adminEmail ?? process.env.ADMIN_NOTIFY_EMAIL?.trim() ?? getNotificationEmail()).trim();
  const adminSms = (input.adminSms ?? process.env.ADMIN_NOTIFY_SMS?.trim() ?? "").trim();

  let emailOk = false;
  let smsOk = false;

  if (shouldNotifyAdmin(input.event, "email") && adminEmail.includes("@")) {
    emailOk = await sendTransactionalEmail(adminEmail, subject, input.bodyText);
  }

  if (shouldNotifyAdmin(input.event, "sms") && /^\+[1-9]\d{6,14}$/.test(adminSms)) {
    const smsBody =
      input.bodyText.length > 300 ? `${input.bodyText.slice(0, 280)}…` : input.bodyText;
    smsOk = await sendSmsViaTwilio(adminSms, `LECIPM: ${smsBody}`);
  }

  return { emailOk, smsOk };
}

/** Example wiring — call from Stripe webhook or booking confirmation handler. */
export async function notifyBookingRevenueExample(amountCents: number): Promise<void> {
  const dollars = (amountCents / 100).toFixed(2);
  const event: PlatformBusinessEvent = {
    type: "BOOKING_CONFIRMED",
    amountCents,
    currency: "CAD",
  };
  await dispatchAdminNotification({
    event,
    subject: `New booking revenue · $${dollars}`,
    bodyText: `A new booking generated $${dollars} CAD.`,
  });
}

function moneyLine(cents: number, currency?: string): string {
  const cur = currency?.trim() || "CAD";
  const dollars = (cents / 100).toFixed(2);
  return `$${dollars} ${cur}`;
}

/** Plain-text body for email/SMS from a typed platform event (AI gate still applies). */
export function formatPlatformBusinessEventBody(event: PlatformBusinessEvent): string {
  switch (event.type) {
    case "BOOKING_CONFIRMED":
      return `Booking confirmed — ${moneyLine(event.amountCents, event.currency)}${event.reference ? `. Ref: ${event.reference}` : ""}`;
    case "LEAD_PURCHASED":
      return `Lead purchased${event.amountCents != null ? ` — ${moneyLine(event.amountCents)}` : ""}${event.reference ? `. Ref: ${event.reference}` : ""}`;
    case "DEAL_CLOSED":
      return `Deal closed${event.amountCents != null ? ` — ${moneyLine(event.amountCents)}` : ""}${event.reference ? `. Ref: ${event.reference}` : ""}`;
    case "MONEY_GENERATED":
      return `Money recorded — ${moneyLine(event.amountCents)}${event.reference ? `. Ref: ${event.reference}` : ""}`;
    case "SUBSCRIPTION_PAID":
      return `Subscription payment${event.amountCents != null ? ` — ${moneyLine(event.amountCents)}` : ""}${event.reference ? `. Ref: ${event.reference}` : ""}`;
    case "PAYOUT_COMPLETED":
      return `Payout completed${event.amountCents != null ? ` — ${moneyLine(event.amountCents)}` : ""}${event.beneficiary ? ` · ${event.beneficiary}` : ""}`;
    case "LISTING_PUBLISHED":
      return `Listing published${event.listingId ? ` · ${event.listingId}` : ""}${event.reference ? ` · ${event.reference}` : ""}`;
    case "LISTING_FEE_PAID":
      return `Listing fee paid${event.amountCents != null ? ` — ${moneyLine(event.amountCents)}` : ""}`;
    case "REVENUE_SPIKE":
      return `Revenue spike detected: ${event.percentChange >= 0 ? "+" : ""}${event.percentChange}% (${event.window ?? "window n/a"})`;
    case "RISK_ALERT":
      return `Risk alert · ${event.code}${event.detail ? `: ${event.detail}` : ""}`;
    case "RISK_ANOMALY":
      return `Anomaly · ${event.code}${event.detail ? `: ${event.detail}` : ""}`;
    case "FRAUD_SUSPECTED":
      return `Fraud signal · ${event.code}${event.detail ? `: ${event.detail}` : ""}`;
    case "HIGH_VALUE_ACTION":
      return `High-value action · ${event.action}${event.detail ? ` — ${event.detail}` : ""}`;
    case "SOINS_EMERGENCY":
      return `Soins emergency · resident ${event.residentId}${event.detail ? ` — ${event.detail}` : ""}`;
    case "SOINS_CARE_ALERT":
      return `Soins alert (${event.severity}) · resident ${event.residentId}${event.alertCode ? ` [${event.alertCode}]` : ""}${event.detail ? ` — ${event.detail}` : ""}`;
  }
}

/**
 * EVENT → dispatch (queue workers should call this after dequeue).
 * Uses `shouldNotifyAdmin` + Resend/Twilio when configured.
 */
export async function notifyPlatformBusinessEvent(
  event: PlatformBusinessEvent,
  overrides?: Partial<Pick<DispatchAdminNotificationInput, "subject" | "bodyText" | "adminEmail" | "adminSms">>
): Promise<{ emailOk: boolean; smsOk: boolean }> {
  const bodyText = overrides?.bodyText ?? formatPlatformBusinessEventBody(event);
  return dispatchAdminNotification({
    event,
    bodyText,
    subject: overrides?.subject,
    adminEmail: overrides?.adminEmail,
    adminSms: overrides?.adminSms,
  });
}
