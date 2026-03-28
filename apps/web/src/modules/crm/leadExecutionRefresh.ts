import { prisma } from "@/lib/db";
import {
  computeFrictionScore,
  computeIntentScore,
  computePriorityScore,
  computeTrustScore,
  computeUrgencyScore,
} from "./aiScoringEngine";
import { deriveExecutionStage } from "./executionStageSync";
import { resolveNextBestAction } from "./nextBestAction";
import type { LeadScoringContext } from "./crmExecutionTypes";

async function buildContext(leadId: string): Promise<{
  ctx: LeadScoringContext;
  pipelineStatus: string;
  pipelineStage: string;
  lostAt: Date | null;
  wonAt: Date | null;
  dealClosedAt: Date | null;
} | null> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      user: { select: { accountStatus: true } },
      crmConversation: { select: { id: true } },
    },
  });
  if (!lead) return null;

  const crmChatUserTurns = lead.crmConversation
    ? await prisma.crmMessage.count({
        where: { conversationId: lead.crmConversation.id, sender: "user" },
      })
    : 0;

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 30);

  const [views, ctas, bookingStartedEv, bookingConfirmedEv, lastEv, platformMsgs] = await Promise.all([
    prisma.internalCrmEvent.count({ where: { leadId, eventType: "listing_view", createdAt: { gte: since } } }),
    prisma.internalCrmEvent.count({
      where: { leadId, eventType: { in: ["cta_click", "listing_contact_click"] }, createdAt: { gte: since } },
    }),
    prisma.internalCrmEvent.findFirst({
      where: { leadId, eventType: "booking_started", createdAt: { gte: since } },
      select: { id: true },
    }),
    prisma.internalCrmEvent.findFirst({
      where: { leadId, eventType: "booking_confirmed", createdAt: { gte: since } },
      select: { id: true },
    }),
    prisma.internalCrmEvent.findFirst({
      where: { leadId, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    lead.platformConversationId
      ? prisma.message.count({ where: { conversationId: lead.platformConversationId } })
      : Promise.resolve(0),
  ]);

  const ctx: LeadScoringContext = {
    listingViews: views,
    ctaClicks: ctas,
    bookingStarted: Boolean(bookingStartedEv),
    bookingConfirmed: Boolean(bookingConfirmedEv),
    platformMessageCount: platformMsgs,
    crmChatUserTurns,
    lastEventAt: lastEv?.createdAt ?? null,
    leadCreatedAt: lead.createdAt,
    leadUpdatedAt: lead.updatedAt,
    hasIntroducedBroker: Boolean(lead.introducedByBrokerId),
    hasAssignedExpert: Boolean(lead.assignedExpertId),
    accountActive: lead.user?.accountStatus === "ACTIVE",
    highIntentFlag: lead.highIntent,
    messageLength: (lead.message ?? "").length,
  };

  return {
    ctx,
    pipelineStatus: lead.pipelineStatus,
    pipelineStage: lead.pipelineStage,
    lostAt: lead.lostAt,
    wonAt: lead.wonAt,
    dealClosedAt: lead.dealClosedAt,
  };
}

/**
 * Recompute scores, stage, next action, and persist on `Lead`.
 */
export async function refreshLeadExecutionLayer(leadId: string): Promise<void> {
  const built = await buildContext(leadId);
  if (!built) return;

  const { ctx, ...pipe } = built;
  const intent = computeIntentScore(ctx);
  const urgency = computeUrgencyScore(ctx);
  const trust = computeTrustScore(ctx);
  const friction = computeFrictionScore(ctx);
  const priorityScore = computePriorityScore({ intent, urgency, trust, friction });
  const executionStage = deriveExecutionStage({ ctx, ...pipe });

  const ref = ctx.lastEventAt ?? ctx.leadUpdatedAt;
  const hoursSinceActivity = ref ? (Date.now() - ref.getTime()) / 36e5 : 999;

  const next = resolveNextBestAction({
    ctx,
    intent,
    urgency,
    friction,
    executionStage,
    hoursSinceActivity,
  });

  const lastActivityAt = ctx.lastEventAt ?? ctx.leadUpdatedAt;

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      intentScore: intent,
      urgencyScore: urgency,
      trustScore: trust,
      frictionScore: friction,
      priorityScore,
      executionStage,
      nextBestAction: next,
      lastActivityAt,
    },
  });
}
