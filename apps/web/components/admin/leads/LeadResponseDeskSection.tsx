import { prisma } from "@/lib/db";
import {
  aiAutopilotFollowupFlags,
  aiAutopilotMessagingAssistFlags,
  aiResponseDeskFlags,
} from "@/config/feature-flags";
import type { AiFollowUpQueueItem } from "@/modules/growth/ai-autopilot-followup.types";
import { buildFollowUpQueue, leadRowToFollowUpInput } from "@/modules/growth/ai-autopilot-followup.service";
import { buildReplyDraftsForLeads } from "@/modules/growth/ai-autopilot-messaging-bulk.service";
import { leadRowToMessagingInput } from "@/modules/growth/ai-autopilot-messaging-mapper";
import { buildResponseDeskItems } from "@/modules/growth/ai-response-desk.service";
import type { AiResponseDeskLeadRow } from "@/modules/growth/ai-response-desk.types";
import { LeadResponseDeskPanel } from "./LeadResponseDeskPanel";

/**
 * Server-loaded response desk queue — additive to LeadIntelligenceSection; no outbound messaging.
 */
export async function LeadResponseDeskSection() {
  if (!aiResponseDeskFlags.aiResponseDeskV1) {
    return null;
  }

  const assistOn = aiAutopilotMessagingAssistFlags.messagingAssistV1;
  const followOn = aiAutopilotFollowupFlags.followupV1;

  let recent: Awaited<ReturnType<typeof prisma.lead.findMany>> = [];
  try {
    recent = await prisma.lead.findMany({
      take: 200,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        message: true,
        aiScore: true,
        aiPriority: true,
        aiTags: true,
        aiExplanation: true,
        createdAt: true,
        lastContactedAt: true,
        launchSalesContacted: true,
        launchLastContactDate: true,
        pipelineStatus: true,
      },
    });
  } catch {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-4 text-sm text-rose-100">
        Response desk could not load leads — retry shortly.
      </div>
    );
  }

  const leadRows: AiResponseDeskLeadRow[] = recent.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    message: r.message,
    aiPriority: r.aiPriority,
    aiTags: r.aiTags,
    aiExplanation: r.aiExplanation,
    createdAt: r.createdAt,
  }));

  const draftsByLeadId = new Map(
    assistOn && recent.length > 0
      ? buildReplyDraftsForLeads(recent.map(leadRowToMessagingInput)).map((d) => [d.leadId, d] as const)
      : [],
  );

  let followByLeadId = new Map<string, AiFollowUpQueueItem>();
  try {
    if (followOn) {
      const inputs = recent.map(leadRowToFollowUpInput);
      const followQueue = buildFollowUpQueue(inputs, {
        remindersEnabled: aiAutopilotFollowupFlags.followupRemindersV1,
      });
      followByLeadId = new Map(followQueue.map((f) => [f.leadId, f]));
    }
  } catch {
    /* queue optional */
  }

  const items = buildResponseDeskItems({
    leads: leadRows,
    draftsByLeadId,
    followByLeadId,
  });

  return (
    <LeadResponseDeskPanel
      initialItems={items}
      reviewActionsEnabled={aiResponseDeskFlags.aiResponseDeskReviewStateV1}
    />
  );
}
