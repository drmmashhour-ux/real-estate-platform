import { prisma } from "@/lib/db";
import { findLeadForBrokerScope } from "@/lib/broker-crm/access";
import type { PlatformRole } from "@prisma/client";
import { isFollowUpDueToday, isFollowUpOverdue } from "@/lib/broker-autopilot/detect-followups-due";
import { isHotLeadSignal } from "@/lib/broker-autopilot/detect-hot-leads";

export async function getAutopilotLeadSnapshot(leadId: string, userId: string, role: PlatformRole) {
  const lead = await findLeadForBrokerScope(leadId, userId, role);
  if (!lead) return null;

  const now = new Date();
  const [thread, openActions] = await Promise.all([
    lead.threadId
      ? prisma.lecipmBrokerListingThread.findUnique({
          where: { id: lead.threadId },
          include: { messages: { orderBy: { createdAt: "asc" }, take: 200 } },
        })
      : null,
    prisma.lecipmBrokerAutopilotAction.findMany({
      where: {
        leadId,
        status: { in: ["suggested", "queued", "approved"] },
        OR: [{ snoozedUntil: null }, { snoozedUntil: { lte: now } }],
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  const messages = thread?.messages ?? [];
  const hot = thread ? isHotLeadSignal({ lead, messages, now }) : false;

  return {
    leadId,
    hot,
    followUpOverdue: isFollowUpOverdue(lead, now),
    followUpDueToday: isFollowUpDueToday(lead, now),
    openActions: openActions.map((a) => ({
      id: a.id,
      title: a.title,
      actionType: a.actionType,
      status: a.status,
      draftMessage: a.draftMessage,
    })),
  };
}
