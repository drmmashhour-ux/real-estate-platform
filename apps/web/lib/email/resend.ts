/**
 * Email client via Resend.
 * All configuration from environment variables; no hardcoded addresses or API keys.
 */

import { Resend } from "resend";

let _resend: Resend | null = null;

/** Lazy singleton so build/runtime never instantiates Resend without an API key. */
export function getResend(): Resend | null {
  if (_resend) return _resend;
  const key = process.env.RESEND_API_KEY;
  if (!key || key === "your_key") return null;
  _resend = new Resend(key);
  return _resend;
}

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== "your_key");
}

/** From address: use EMAIL_FROM (e.g. "LECIPM <dr.m.mashhour@gmail.com>"). */
export function getFromEmail(): string {
  return process.env.EMAIL_FROM || "onboarding@resend.dev";
}

/** Company reply-to address for client-facing emails (replies from client come here). */
export function getReplyToEmail(): string | undefined {
  return process.env.EMAIL_REPLY_TO?.trim() || undefined;
}

/** Recipient for internal notifications (broker/team). Prefers plain address. */
export function getNotificationEmail(): string {
  const raw =
    process.env.BROKER_EMAIL || process.env.EMAIL_REPLY_TO || process.env.EMAIL_FROM || "";
  const match = raw.match(/<([^>]+)>/);
  return match ? match[1].trim() : raw.trim();
}

export type SendEmailOptions = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
};

/**
 * Send an email via Resend. Uses EMAIL_FROM for "from".
 * If RESEND_API_KEY is missing, logs payload and does not throw.
 */
export async function sendEmail({ to, subject, html, replyTo }: SendEmailOptions): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.log("[Email] Resend not configured. Would send:", { to, subject, replyTo });
    return false;
  }
  const from = getFromEmail();
  if (!from) {
    console.warn("[Email] EMAIL_FROM not set; skipping send.");
    return false;
  }
  try {
    await resend.emails.send({
      from,
      to,
      subject,
      html,
      ...(replyTo && replyTo.includes("@") ? { replyTo } : {}),
    });
    return true;
  } catch (err) {
    console.error("[Email] Send failed:", err);
    return false;
  }
}
