import { isResendConfigured, sendEmail } from "@/lib/email/resend";

/**
 * Opt-in only — called after explicit consent on capture forms. No cold outreach.
 */
export async function sendBuyerEarlyAccessWelcome(params: { to: string; name?: string | null }): Promise<boolean> {
  if (!isResendConfigured()) return false;
  const name = params.name?.trim() || "there";
  return sendEmail({
    to: params.to,
    subject: "You’re on the early access list — LECIPM",
    html: `<p>Hi ${escapeHtml(name)},</p>
<p>Thanks for opting in. We’ll share product updates as we expand city by city.</p>
<p>— LECIPM</p>`,
  });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
