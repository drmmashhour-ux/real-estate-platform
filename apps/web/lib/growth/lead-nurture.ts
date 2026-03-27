import { sendEmail, getReplyToEmail } from "@/lib/email/resend";
import { getLegalEmailFooter } from "@/lib/email/notifications";

const BASE = () => process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";

/**
 * Second touch in the CRM flow: actionable links after a lead is created.
 * (Drip reminders can be added via existing automation / cron on Lead.)
 */
export async function sendGrowthLeadFollowUpEmail(to: string, name: string): Promise<void> {
  if (!to?.includes("@")) return;
  const base = BASE();
  const safeName = name?.trim() || "there";
  const subject = "Your next steps with LECIPM";
  const html = `
  <div style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;max-width:560px;">
    <p>Hi ${safeName},</p>
    <p>Thanks for reaching out. Here are quick links to keep momentum:</p>
    <ul>
      <li><a href="${base}/mortgage">Mortgage & pre-approval</a></li>
      <li><a href="${base}/evaluate">Free evaluation / estimate</a></li>
      <li><a href="${base}/experts">Talk to an expert</a></li>
      <li><a href="${base}/blog">Guides on buying, renting, and mortgages</a></li>
    </ul>
    <p>Reply to this email if anything is unclear — we’re here to help.</p>
  </div>
  ${getLegalEmailFooter()}
  `;
  const replyTo = getReplyToEmail();
  await sendEmail({
    to,
    subject,
    html,
    ...(replyTo ? { replyTo } : {}),
  });
}
