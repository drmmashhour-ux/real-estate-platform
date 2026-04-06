import { isResendConfigured, sendEmail, getFromEmail } from "@/lib/email/resend";
import type { MarketingPublishInput, ProviderPublishResult } from "../types";
import {
  getMarketingEmailRecipients,
  isMarketingEmailLiveSendEnabled,
} from "../marketing-email-recipients";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function emailProviderPublish(input: MarketingPublishInput): Promise<ProviderPublishResult> {
  const subject = input.emailSubject?.trim() || "Marketing message";
  const body = input.emailBody?.trim() || input.bodyText;
  const cta = input.emailCta?.trim();

  const recipients = getMarketingEmailRecipients();
  const wantLive =
    input.allowLive && isMarketingEmailLiveSendEnabled() && isResendConfigured() && recipients.length > 0;

  const htmlParts = [
    `<p>${escapeHtml(body).replace(/\n/g, "<br/>")}</p>`,
    cta ? `<p><strong>CTA:</strong> ${escapeHtml(cta)}</p>` : "",
  ];
  const html = `<!DOCTYPE html><html><body>${htmlParts.join("")}</body></html>`;

  if (!wantLive) {
    const summary = [
      "Dry-run / not sent.",
      recipients.length ? `Would send to: ${recipients.join(", ")}` : "No recipients (set MARKETING_EMAIL_TO or BROKER_EMAIL / notification path).",
      `From: ${getFromEmail()}`,
      `Subject: ${subject}`,
      !isMarketingEmailLiveSendEnabled() ? "MARKETING_EMAIL_LIVE_SEND is not 1." : "",
      !isResendConfigured() ? "Resend not configured." : "",
    ]
      .filter(Boolean)
      .join(" ");

    return {
      ok: true,
      executedDryRun: true,
      summary,
      externalPostId: null,
    };
  }

  let anySent = false;
  const errors: string[] = [];
  for (const to of recipients) {
    const sent = await sendEmail({ to, subject, html });
    if (sent) anySent = true;
    else errors.push(to);
  }

  if (!anySent) {
    return {
      ok: false,
      executedDryRun: false,
      errorMessage: errors.length ? `Send failed for: ${errors.join(", ")}` : "No email accepted by provider",
      summary: "Resend returned failure for all recipients",
    };
  }

  return {
    ok: true,
    executedDryRun: false,
    summary: `Sent to ${recipients.length} recipient(s) via Resend`,
    externalPostId: `resend-batch:${recipients.length}`,
  };
}
