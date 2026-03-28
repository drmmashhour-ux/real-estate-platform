import { prisma } from "@/lib/db";
import {
  computeFrictionScore,
  computeIntentScore,
  computePriorityScore,
  computeTrustScore,
  computeUrgencyScore,
} from "./aiScoringEngine";
import type { LeadScoringContext } from "./crmExecutionTypes";

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/**
 * Guest Immo threads (no Lead yet): lightweight scoring on `CrmConversation`.
 */
export async function refreshCrmConversationExecution(conversationId: string): Promise<void> {
  const convo = await prisma.crmConversation.findUnique({
    where: { id: conversationId },
    select: { id: true, leadId: true, updatedAt: true, metadata: true },
  });
  if (!convo) return;

  if (convo.leadId) {
    const { refreshLeadExecutionLayer } = await import("./leadExecutionRefresh");
    await refreshLeadExecutionLayer(convo.leadId);
    return;
  }

  const [userTurns, totalMsgs] = await Promise.all([
    prisma.crmMessage.count({ where: { conversationId, sender: "user" } }),
    prisma.crmMessage.count({ where: { conversationId } }),
  ]);

  const meta = convo.metadata as Record<string, unknown> | null;
  const intentLabel = typeof meta?.intent === "string" ? meta.intent : "";

  const ctx: LeadScoringContext = {
    listingViews: 0,
    ctaClicks: intentLabel === "expert" ? 2 : 0,
    bookingStarted: false,
    bookingConfirmed: false,
    platformMessageCount: totalMsgs,
    crmChatUserTurns: userTurns,
    lastEventAt: convo.updatedAt,
    leadCreatedAt: convo.updatedAt,
    leadUpdatedAt: convo.updatedAt,
    hasIntroducedBroker: false,
    hasAssignedExpert: false,
    accountActive: false,
    highIntentFlag: intentLabel === "expert" || userTurns >= 3,
    messageLength: userTurns * 40,
  };

  const intent = clamp(computeIntentScore(ctx) + userTurns * 5);
  const urgency = computeUrgencyScore(ctx);
  const trust = computeTrustScore(ctx);
  const friction = computeFrictionScore(ctx);
  const priorityScore = computePriorityScore({ intent, urgency, trust, friction });

  let nextBestAction = "wait";
  if (userTurns >= 2 && intent > 40) nextBestAction = "offer_help";
  if (intentLabel === "expert" || userTurns >= 4) nextBestAction = "assign_broker";

  await prisma.crmConversation.update({
    where: { id: conversationId },
    data: {
      intentScore: intent,
      urgencyScore: urgency,
      trustScore: trust,
      frictionScore: friction,
      priorityScore,
      nextBestAction,
      lastActivityAt: new Date(),
    },
  });
}
