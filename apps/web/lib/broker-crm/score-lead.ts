import type { LecipmBrokerCrmPriorityLabel } from "@prisma/client";
import { prisma } from "@/lib/db";
import { trackBrokerCrm } from "@/lib/broker-crm/analytics";

const INTENT_RE =
  /ready to (buy|make an offer)|pre-?approved|mortgage|financing|serious (buyer|offer)|moving (to|from)|timeline|soon/i;
const VISIT_RE =
  /visit|tour|showing|see (the )?(property|place|unit|home|condo)|walkthrough|disponible pour visite|visite/i;
const CALLBACK_RE = /call (me|back)|callback|phone|rappel|joindre/i;

function labelFromScore(score: number): LecipmBrokerCrmPriorityLabel {
  if (score >= 60) return "high";
  if (score >= 30) return "medium";
  return "low";
}

/**
 * Rule-based priority score (recalculable). AI does not override this in MVP.
 */
export async function scoreBrokerCrmLead(leadId: string): Promise<{ priorityScore: number; priorityLabel: LecipmBrokerCrmPriorityLabel }> {
  const lead = await prisma.lecipmBrokerCrmLead.findUnique({
    where: { id: leadId },
    include: {
      thread: {
        include: {
          messages: { orderBy: { createdAt: "asc" }, select: { body: true, senderRole: true, createdAt: true } },
        },
      },
    },
  });
  if (!lead?.thread) {
    return { priorityScore: 0, priorityLabel: "low" };
  }

  const texts = lead.thread.messages.map((m) => m.body.toLowerCase()).join("\n");
  let score = 0;

  if (INTENT_RE.test(texts)) score += 20;
  if (VISIT_RE.test(texts) || CALLBACK_RE.test(texts)) score += 25;

  const inboundCount = lead.thread.messages.filter((m) => m.senderRole === "customer" || m.senderRole === "guest").length;
  if (inboundCount >= 2) score += 15;

  const lastAt = lead.thread.lastMessageAt.getTime();
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  if (lastAt >= dayAgo) score += 10;

  const unreadInbound = await prisma.lecipmBrokerListingMessage.count({
    where: {
      threadId: lead.thread.id,
      isRead: false,
      senderRole: { in: ["customer", "guest"] },
    },
  });
  const brokerReplied = lead.thread.messages.some((m) => m.senderRole === "broker" || m.senderRole === "admin");
  if (unreadInbound > 0 && !brokerReplied) score += 10;

  const label = labelFromScore(score);

  await prisma.lecipmBrokerCrmLead.update({
    where: { id: leadId },
    data: { priorityScore: score, priorityLabel: label },
  });

  const brokerId = lead.brokerUserId;
  trackBrokerCrm(
    "broker_crm_priority_scored",
    { leadId, priorityScore: score, priorityLabel: label },
    { userId: brokerId }
  );

  return { priorityScore: score, priorityLabel: label };
}
