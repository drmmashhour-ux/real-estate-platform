/**
 * Email provider abstraction: Resend (default), optional SendGrid via REST (no extra npm dep).
 *
 * Env:
 * - EMAIL_PROVIDER=resend | sendgrid (default: resend if RESEND_API_KEY set, else sendgrid if SENDGRID_API_KEY)
 * - RESEND_API_KEY, EMAIL_FROM
 * - SENDGRID_API_KEY (when using sendgrid)
 */

import { sendEmail as sendViaResend, getResend, getFromEmail, getReplyToEmail } from "@/lib/email/resend";
import { logInfo, logError } from "@/lib/logger";

export type TransactionalEmailPayload = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  /** Logical template name for logs only (no PII). */
  template?: string;
};

function resolveProvider(): "resend" | "sendgrid" | "none" {
  const explicit = process.env.EMAIL_PROVIDER?.trim().toLowerCase();
  if (explicit === "sendgrid") return process.env.SENDGRID_API_KEY ? "sendgrid" : "none";
  if (explicit === "resend") return getResend() ? "resend" : "none";
  if (getResend()) return "resend";
  if (process.env.SENDGRID_API_KEY?.trim()) return "sendgrid";
  return "none";
}

function sendgridFrom(): { email: string; name?: string } {
  const from = getFromEmail();
  const m = from.match(/^(?:"?([^"<]+)"?\s*)?<([^>]+)>$/);
  if (m) {
    const name = m[1]?.trim();
    return name ? { email: m[2].trim(), name } : { email: m[2].trim() };
  }
  return { email: from.trim() };
}

async function sendViaSendGrid(payload: TransactionalEmailPayload): Promise<boolean> {
  const key = process.env.SENDGRID_API_KEY?.trim();
  if (!key) return false;
  const from = sendgridFrom();
  try {
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: payload.to }] }],
        from,
        subject: payload.subject,
        content: [{ type: "text/html", value: payload.html }],
        ...(payload.replyTo?.includes("@") ? { reply_to: { email: payload.replyTo } } : {}),
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      logError("email_provider_sendgrid_failed", { status: res.status, body: text.slice(0, 200) });
      return false;
    }
    return true;
  } catch (e) {
    logError("email_provider_sendgrid_error", e);
    return false;
  }
}

/**
 * Send one transactional email. Does not throw — returns success flag.
 * Logs template name and outcome; never logs body or full addresses in error paths.
 */
export async function sendTransactionalEmail(payload: TransactionalEmailPayload): Promise<boolean> {
  const provider = resolveProvider();
  const template = payload.template ?? "unknown";
  if (provider === "none") {
    logInfo("email_provider_skip", { template, reason: "not_configured" });
    return false;
  }
  try {
    if (provider === "resend") {
      const ok = await sendViaResend({
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        replyTo: payload.replyTo ?? getReplyToEmail(),
      });
      logInfo("email_provider_result", { template, provider: "resend", ok });
      return ok;
    }
    const ok = await sendViaSendGrid({
      ...payload,
      replyTo: payload.replyTo ?? getReplyToEmail(),
    });
    logInfo("email_provider_result", { template, provider: "sendgrid", ok });
    return ok;
  } catch (e) {
    logError("email_provider_send_error", { template, provider, err: e instanceof Error ? e.message : "error" });
    return false;
  }
}

export function getConfiguredEmailProvider(): string {
  return resolveProvider();
}
