import type { AdapterResult } from "@/src/modules/growth-automation/domain/growth-automation.types";
import type { DraftPayload } from "@/src/modules/growth-automation/domain/growth-automation.types";
import { sendEmail, isResendConfigured } from "@/lib/email/resend";

export async function publishEmail(args: {
  draft: DraftPayload;
  to: string;
  subject?: string;
}): Promise<AdapterResult> {
  if (!isResendConfigured()) {
    return { ok: false, code: "EMAIL_PROVIDER", message: "Resend not configured (RESEND_API_KEY)." };
  }
  const html = `<p>${args.draft.hook}</p><p>${args.draft.body.replace(/\n/g, "</p><p>")}</p><p><strong>${args.draft.cta}</strong></p>`;
  const ok = await sendEmail({
    to: args.to,
    subject: args.subject || args.draft.hook.slice(0, 80),
    html,
  });
  if (!ok) return { ok: false, code: "EMAIL_SEND", message: "Email send failed or skipped" };
  return { ok: true, externalPostId: `email-${Date.now()}`, raw: { to: args.to } };
}
