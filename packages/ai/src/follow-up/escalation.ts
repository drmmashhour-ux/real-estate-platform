import { prisma } from "@/lib/db";
import { appendLeadTimeline } from "./timeline";
import { sendFollowUpEscalationEmail } from "@/lib/email/notifications";
import { tierFromScore } from "@/lib/ai/lead-tier";

export async function escalateLeadToBroker(params: {
  leadId: string;
  reason: string;
  summary?: Record<string, unknown>;
  brokerId?: string | null;
}): Promise<void> {
  const lead = await prisma.lead.findUnique({
    where: { id: params.leadId },
    include: {
      introducedByBroker: { select: { id: true, email: true, name: true } },
    },
  });
  if (!lead) return;

  await prisma.lead.update({
    where: { id: params.leadId },
    data: { pipelineStatus: "broker_assigned" },
  });

  await appendLeadTimeline(params.leadId, "broker_escalation", {
    reason: params.reason,
    ...params.summary,
  });

  const tier = lead.aiTier ?? tierFromScore(lead.score);
  await sendFollowUpEscalationEmail({
    leadId: lead.id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    listingId: lead.listingId,
    listingCode: lead.listingCode,
    score: lead.score,
    tier,
    reason: params.reason,
    transcriptSummary: typeof lead.message === "string" ? lead.message.slice(0, 4000) : "",
    brokerEmail: lead.introducedByBroker?.email ?? undefined,
  }).catch(() => {});

  const brokerForCrm = params.brokerId ?? lead.introducedByBrokerId;
  if (brokerForCrm) {
    await prisma.crmInteraction
      .create({
        data: {
          leadId: lead.id,
          brokerId: brokerForCrm,
          type: "ai_suggestion",
          body: `AI follow-up escalation: ${params.reason}. Review lead ${lead.id} and timeline.`,
          metadata: { automation: "ai_follow_up_escalation_v1", ...params.summary },
        },
      })
      .catch(() => {});
  }
}
