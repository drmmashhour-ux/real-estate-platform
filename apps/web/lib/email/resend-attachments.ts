/**
 * Additive helpers for Resend emails with attachments (executive reporting).
 */

import { getFromEmail, getReplyToEmail, getResend } from "./resend";

export type SendEmailWithAttachmentOptions = {
  to: string | string[];
  subject: string;
  html: string;
  attachments: { filename: string; content: Buffer }[];
  replyTo?: string;
};

/**
 * Sends via Resend with base64 attachments. Does not throw; returns false on failure or misconfiguration.
 */
export async function sendEmailWithAttachments({
  to,
  subject,
  html,
  attachments,
  replyTo,
}: SendEmailWithAttachmentOptions): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.log("[Email] Resend not configured. Would send with attachments:", {
      to,
      subject,
      filenames: attachments.map((a) => a.filename),
    });
    return false;
  }
  const from = getFromEmail();
  if (!from) {
    console.warn("[Email] EMAIL_FROM not set; skipping send.");
    return false;
  }
  const rt = replyTo?.includes("@") ? replyTo : getReplyToEmail();
  try {
    const { error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
      ...(rt ? { replyTo: rt } : {}),
      attachments: attachments.map((a) => ({
        filename: a.filename,
        content: a.content.toString("base64"),
      })),
    });
    if (error) {
      console.error("[Email] Send with attachments failed:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Email] Send with attachments failed:", err);
    return false;
  }
}
