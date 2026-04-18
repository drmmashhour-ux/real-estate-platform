/**
 * Lightweight response-desk summary for cadence — read-only; reuses desk ordering rules.
 */

import { prisma } from "@/lib/db";
import {
  aiAutopilotFollowupFlags,
  aiAutopilotMessagingAssistFlags,
  aiResponseDeskFlags,
} from "@/config/feature-flags";
import type { AiFollowUpQueueItem } from "./ai-autopilot-followup.types";
import { buildFollowUpQueue, leadRowToFollowUpInput } from "./ai-autopilot-followup.service";
import { buildReplyDraftsForLeads } from "./ai-autopilot-messaging-bulk.service";
import { leadRowToMessagingInput } from "./ai-autopilot-messaging-mapper";
import { buildResponseDeskItems } from "./ai-response-desk.service";
import type { AiResponseDeskLeadRow } from "./ai-response-desk.types";

export type ResponseDeskCadenceHint = {
  titles: string[];
  itemCount: number;
  urgentCount: number;
};

export async function loadResponseDeskCadenceHints(): Promise<ResponseDeskCadenceHint | null> {
  if (!aiResponseDeskFlags.aiResponseDeskV1) {
    return null;
  }

  const assistOn = aiAutopilotMessagingAssistFlags.messagingAssistV1;
  const followOn = aiAutopilotFollowupFlags.followupV1;

  let recent: Awaited<ReturnType<typeof prisma.lead.findMany>>;
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
    return null;
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
    followByLeadId = new Map();
  }

  const items = buildResponseDeskItems({
    leads: leadRows,
    draftsByLeadId,
    followByLeadId,
  });

  const urgentCount = items.filter(
    (i) => i.draftStatus === "followup_recommended" || i.aiPriority === "high",
  ).length;

  const titles = items.slice(0, 5).map((i) => `${i.leadName} (${i.draftStatus})`);

  return {
    titles,
    itemCount: items.length,
    urgentCount,
  };
}
