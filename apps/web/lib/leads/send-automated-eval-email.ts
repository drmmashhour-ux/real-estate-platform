import { prisma } from "@/lib/db";
import { sendEmail, getReplyToEmail } from "@/lib/email/resend";
import { getLegalEmailFooter } from "@/lib/email/notifications";
import {
  getEvaluationFollowUpEmail,
  type FollowUpTemplateId,
} from "@/lib/email/evaluation-follow-up-templates";
import { appendLeadTimelineEvent } from "@/lib/leads/timeline-helpers";

/**
 * Automated sequence emails (templates 2 & 3). Never throws — caller logs failures.
 */
export async function sendAutomatedEvaluationEmail(
  leadId: string,
  templateId: FollowUpTemplateId
): Promise<{ sent: boolean; skippedReason?: string }> {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return { sent: false, skippedReason: "not_found" };
  if (lead.leadSource !== "evaluation_lead") return { sent: false, skippedReason: "wrong_source" };
  if (lead.optedOutOfFollowUp) return { sent: false, skippedReason: "opted_out" };
  if (lead.pipelineStatus === "lost" || lead.pipelineStatus === "won") {
    return { sent: false, skippedReason: "terminal_stage" };
  }
  if (!lead.email?.includes("@")) return { sent: false, skippedReason: "no_email" };

  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://lecipm.com";
  const { subject, html } = getEvaluationFollowUpEmail(templateId, {
    recipientName: lead.name,
    baseUrl: base,
  });

  const replyTo = getReplyToEmail();
  const sent = await sendEmail({
    to: lead.email,
    subject,
    html: html + getLegalEmailFooter(),
    ...(replyTo ? { replyTo } : {}),
  }).catch(() => false);

  await appendLeadTimelineEvent(leadId, "email_sent", {
    templateId,
    subject,
    automated: true,
    sent,
  });

  if (sent) {
    const status =
      templateId === "evaluation_followup_2" ? "followup_24h_sent" : "followup_72h_sent";
    await prisma.lead
      .update({
        where: { id: leadId },
        data: {
          lastAutomationEmailAt: new Date(),
          evaluationEmailStatus: status,
        },
      })
      .catch(() => {});
  }

  return { sent: !!sent };
}
