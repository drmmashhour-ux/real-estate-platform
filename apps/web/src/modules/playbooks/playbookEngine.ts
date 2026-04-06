import { prisma } from "@/lib/db";
import type { DealAssistantAnalysis } from "@/src/modules/deal-assistant/dealAssistantEngine";
import { analyzeConversation, type ConversationMessageInput } from "@/src/modules/deal-assistant/dealAssistantEngine";
import { mergePlaybookWithDealAssistant } from "./playbookDealMerge";

export const PLAYBOOK_KEYS = {
  buyer: "buyer_conversion",
  host: "host_conversion",
  broker: "broker_conversion",
} as const;

export type PlaybookUserType = keyof typeof PLAYBOOK_KEYS;

export type PlaybookUserContext = {
  playbookKey: string;
  executionStage: string;
  intentScore: number;
  highIntent: boolean;
  pipelineStatus: string;
  hasListingContext: boolean;
  bookingOrNegotiation: boolean;
};

function keyForType(userType: PlaybookUserType): string {
  return PLAYBOOK_KEYS[userType];
}

/** Resolve playbook definition (steps ordered) for a persona. */
export async function getPlaybookForUser(userType: PlaybookUserType) {
  return prisma.playbook.findUnique({
    where: { key: keyForType(userType) },
    include: { steps: { orderBy: { stepOrder: "asc" } } },
  });
}

export function inferPlaybookKeyFromLead(lead: {
  leadSource: string | null;
  shortTermListingId?: string | null;
}): string {
  const src = (lead.leadSource ?? "").toLowerCase();
  if (src.includes("host") || src.includes("bnhub_host") || src === "host_listing") return PLAYBOOK_KEYS.host;
  const isBuyerBrokerTouch =
    src.includes("broker_consultation") || src.includes("evaluation_lead") || src.includes("listing_contact");
  if (
    !isBuyerBrokerTouch &&
    (/(^|_)broker_(partner|recruit|signup|onboarding)/.test(src) ||
      src.includes("broker_recruit") ||
      src.includes("broker_partner"))
  ) {
    return PLAYBOOK_KEYS.broker;
  }
  return PLAYBOOK_KEYS.buyer;
}

export function evaluateNextStep(ctx: PlaybookUserContext): number {
  if (ctx.playbookKey === PLAYBOOK_KEYS.buyer) return evaluateBuyerStep(ctx);
  if (ctx.playbookKey === PLAYBOOK_KEYS.host) return evaluateHostStep(ctx);
  if (ctx.playbookKey === PLAYBOOK_KEYS.broker) return evaluateBrokerStep(ctx);
  return 1;
}

function evaluateBuyerStep(ctx: PlaybookUserContext): number {
  const st = ctx.executionStage;
  if (
    ctx.bookingOrNegotiation ||
    ctx.intentScore >= 70 ||
    ctx.highIntent ||
    st === "booking_started" ||
    st === "negotiation"
  ) {
    return 3;
  }
  if (st === "inquiry_sent" || st === "broker_connected") return 2;
  return 1;
}

function evaluateHostStep(ctx: PlaybookUserContext): number {
  if (ctx.bookingOrNegotiation || ctx.executionStage === "booking_started" || ctx.executionStage === "negotiation") {
    return 3;
  }
  if (ctx.hasListingContext) return 2;
  return 1;
}

function evaluateBrokerStep(ctx: PlaybookUserContext): number {
  const p = ctx.pipelineStatus.toLowerCase();
  if (p === "new" || p === "lost") return 1;
  return 2;
}

export function getRecommendedAction(step: { recommendedAction: string } | null | undefined): string {
  return step?.recommendedAction?.trim() ?? "";
}

export function getRecommendedMessage(step: { messageTemplate: string } | null | undefined): string {
  return step?.messageTemplate?.trim() ?? "";
}

/** Latest active playbook progress for a platform user (non-lead surfaces). */
export async function getCurrentStep(userId: string) {
  const ex = await prisma.playbookExecution.findFirst({
    where: { userId, status: "active" },
    orderBy: { updatedAt: "desc" },
    include: {
      playbook: { include: { steps: { orderBy: { stepOrder: "asc" } } } },
    },
  });
  if (!ex) return null;
  const step = ex.playbook.steps.find((s) => s.stepOrder === ex.currentStep) ?? null;
  return { execution: ex, step };
}

/** Recompute target step from CRM execution layer + persist (call after `refreshLeadExecutionLayer`). */
export async function syncPlaybookExecutionForLead(leadId: string): Promise<void> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      userId: true,
      leadSource: true,
      shortTermListingId: true,
      fsboListingId: true,
      listingId: true,
      executionStage: true,
      intentScore: true,
      highIntent: true,
      pipelineStatus: true,
      lostAt: true,
      wonAt: true,
      dealClosedAt: true,
    },
  });
  if (!lead) return;

  const playbookKey = inferPlaybookKeyFromLead({
    leadSource: lead.leadSource,
    shortTermListingId: lead.shortTermListingId,
  });

  const playbook = await prisma.playbook.findUnique({
    where: { key: playbookKey },
    select: { id: true },
  });
  if (!playbook) return;

  const ctx: PlaybookUserContext = {
    playbookKey,
    executionStage: lead.executionStage,
    intentScore: lead.intentScore,
    highIntent: lead.highIntent,
    pipelineStatus: lead.pipelineStatus,
    hasListingContext: Boolean(lead.shortTermListingId || lead.fsboListingId || lead.listingId),
    bookingOrNegotiation: lead.executionStage === "booking_started" || lead.executionStage === "negotiation",
  };

  const targetStep = evaluateNextStep(ctx);

  let status = "active";
  if (lead.lostAt) status = "dropped";
  else if (lead.wonAt || lead.dealClosedAt || lead.executionStage === "closed") status = "completed";

  await prisma.$transaction([
    prisma.playbookExecution.deleteMany({
      where: { leadId, NOT: { playbookId: playbook.id } },
    }),
    prisma.playbookExecution.upsert({
      where: { leadId_playbookId: { leadId, playbookId: playbook.id } },
      create: {
        leadId,
        userId: lead.userId,
        playbookId: playbook.id,
        currentStep: targetStep,
        status,
      },
      update: {
        currentStep: targetStep,
        status,
        ...(lead.userId ? { userId: lead.userId } : {}),
      },
    }),
  ]);
}

export type PlaybookLeadSnapshot = {
  playbookKey: string;
  playbookName: string;
  executionStatus: string;
  currentStep: number;
  stepCount: number;
  stage: string | null;
  recommendedAction: string;
  messageTemplate: string;
  bestMessage: string;
  nextStepPreview: { stepOrder: number; stage: string; recommendedAction: string } | null;
};

export async function getPlaybookSnapshotForLead(
  leadId: string,
  options?: { composeWithDealAssistant?: boolean }
): Promise<PlaybookLeadSnapshot | null> {
  await syncPlaybookExecutionForLead(leadId);

  const ex = await prisma.playbookExecution.findFirst({
    where: { leadId },
    orderBy: { updatedAt: "desc" },
    include: {
      playbook: { include: { steps: { orderBy: { stepOrder: "asc" } } } },
    },
  });
  if (!ex) return null;

  const step = ex.playbook.steps.find((s) => s.stepOrder === ex.currentStep) ?? null;
  const next = ex.playbook.steps.find((s) => s.stepOrder === ex.currentStep + 1) ?? null;

  const messageTemplate = getRecommendedMessage(step);
  let bestMessage = messageTemplate;

  if (options?.composeWithDealAssistant && messageTemplate) {
    const convo = await prisma.crmConversation.findUnique({
      where: { leadId },
      include: { messages: { orderBy: { createdAt: "asc" }, take: 80 } },
    });
    if (convo?.messages.length) {
      const inputs: ConversationMessageInput[] = convo.messages.map((m) => ({
        senderType: m.sender === "user" ? "user" : "assistant",
        messageText: m.content,
        createdAt: m.createdAt,
      }));
      const ai: DealAssistantAnalysis = analyzeConversation(inputs);
      bestMessage = mergePlaybookWithDealAssistant(messageTemplate, ai);
    }
  }

  return {
    playbookKey: ex.playbook.key,
    playbookName: ex.playbook.name,
    executionStatus: ex.status,
    currentStep: ex.currentStep,
    stepCount: ex.playbook.steps.length,
    stage: step?.stage ?? null,
    recommendedAction: getRecommendedAction(step),
    messageTemplate,
    bestMessage,
    nextStepPreview: next
      ? { stepOrder: next.stepOrder, stage: next.stage, recommendedAction: next.recommendedAction }
      : null,
  };
}

/** Pure helper for tests / previews without DB. */
export function previewStepFromLeadSnapshot(lead: {
  leadSource: string | null;
  shortTermListingId: string | null;
  fsboListingId: string | null;
  listingId: string | null;
  executionStage: string;
  intentScore: number;
  highIntent: boolean;
  pipelineStatus: string;
}): { playbookKey: string; stepOrder: number } {
  const playbookKey = inferPlaybookKeyFromLead({
    leadSource: lead.leadSource,
    shortTermListingId: lead.shortTermListingId,
  });
  const ctx: PlaybookUserContext = {
    playbookKey,
    executionStage: lead.executionStage,
    intentScore: lead.intentScore,
    highIntent: lead.highIntent,
    pipelineStatus: lead.pipelineStatus,
    hasListingContext: Boolean(lead.shortTermListingId || lead.fsboListingId || lead.listingId),
    bookingOrNegotiation: lead.executionStage === "booking_started" || lead.executionStage === "negotiation",
  };
  return { playbookKey, stepOrder: evaluateNextStep(ctx) };
}
