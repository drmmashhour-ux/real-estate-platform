import { logInfo } from "@/lib/logger";
import { prisma } from "@/lib/db";
import {
  type AiClassifierContext,
  type AiFlowHint,
  type AiIntent,
  type AiObjection,
  classifyInbound,
} from "@/src/modules/messaging/aiClassifier";
import { updateGrowthAiOutcome } from "@/src/modules/messaging/outcomes";
import { recordTemplateSent } from "@/src/modules/messaging/learning/templatePerformance";
import {
  generateReply,
  loadTemplate,
  personalizeTemplate,
  resolveAdaptiveTemplateSelection,
  selectTemplateKeyFromClassification,
  type ReplyContext,
} from "@/src/modules/messaging/aiReplyEngine";
import {
  computePressureScore,
  refreshGrowthAiConversationStage,
  type GrowthAiFunnelStage,
} from "@/src/modules/messaging/growthAiStage";
import { MarketplacePersona, PlatformRole, type Prisma } from "@prisma/client";

export function isAiAutoReplyEnabled(): boolean {
  return process.env.AI_AUTO_REPLY_ENABLED === "1";
}

/** Silent nudge runs with auto-reply unless explicitly disabled (`AI_SILENT_NUDGE_ENABLED=0`). */
export function isSilentNudgeEnabled(): boolean {
  if (!isAiAutoReplyEnabled()) return false;
  return process.env.AI_SILENT_NUDGE_ENABLED !== "0";
}

/**
 * After checkout started, short or hesitant guest lines → trust/timing-style booking copy, not generic clarify.
 */
function applyCheckoutTemplateBias(
  intent: AiIntent,
  objection: AiObjection,
  ctx: AiClassifierContext
): AiObjection {
  if (!ctx.checkoutStarted || intent !== "booking_interest") return objection;
  if (objection !== "none" && objection !== "uncertainty") return objection;
  return "trust";
}

type ContextJson = {
  city?: string;
  listing_title?: string;
  last_action?: string;
  flow_hint?: AiFlowHint;
};

export async function inferFlowHintFromUser(userId: string): Promise<AiFlowHint> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, marketplacePersona: true },
  });
  if (u?.role === PlatformRole.HOST || u?.role === PlatformRole.BROKER) {
    if (u.role === PlatformRole.HOST) return "host";
    return "broker";
  }

  const events = await prisma.userEvent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 12,
    select: { eventType: true },
  });
  const types = events.map((e) => e.eventType);
  if (types.includes("CHECKOUT_START") || types.includes("BOOKING_START")) return "booking";
  if (types.includes("LISTING_VIEW") || types.includes("INQUIRY") || types.includes("FAVORITE")) return "buyer";
  if (u?.marketplacePersona === MarketplacePersona.BUYER) return "buyer";
  return "unknown";
}

export async function buildClassifierContext(
  userId: string,
  priorUserTexts: string[],
  options?: { conversationId?: string; humanTakeoverAt?: Date | null }
): Promise<AiClassifierContext> {
  const events = await prisma.userEvent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 16,
    select: { eventType: true },
  });
  const flowHint = await inferFlowHintFromUser(userId);
  const types = events.map((e) => e.eventType);
  const checkoutStarted = types.includes("CHECKOUT_START") || types.includes("BOOKING_START");
  const inquirySentFromEvents = types.includes("INQUIRY");
  const listingRecentlyViewed =
    types.includes("LISTING_VIEW") || types.includes("INQUIRY") || types.includes("FAVORITE");
  const listingViewCount = types.filter((t) => t === "LISTING_VIEW").length;
  const repeatedListingInterest = listingViewCount >= 3;

  let threadHasAiReply = false;
  let priorObjectionMessageCount = 0;
  if (options?.conversationId) {
    threadHasAiReply =
      (await prisma.growthAiConversationMessage.count({
        where: { conversationId: options.conversationId, senderType: "ai" },
      })) > 0;
    priorObjectionMessageCount = await prisma.growthAiConversationMessage.count({
      where: {
        conversationId: options.conversationId,
        senderType: "user",
        NOT: {
          OR: [{ detectedObjection: null }, { detectedObjection: "none" }],
        },
      },
    });
  }

  return {
    flowHint,
    priorUserTexts,
    lastEventTypes: types,
    checkoutStarted,
    inquirySent: inquirySentFromEvents,
    listingRecentlyViewed,
    repeatedListingInterest,
    threadHasAiReply,
    humanTakeover: Boolean(options?.humanTakeoverAt),
    priorObjectionMessageCount,
  };
}

function replyContextFromUser(
  u: { name: string | null; email: string } | null,
  ctx: ContextJson | null
): ReplyContext {
  const name = u?.name?.trim() || u?.email?.split("@")[0] || "there";
  return {
    name,
    city: ctx?.city ?? "your area",
    listing_title: ctx?.listing_title ?? "this listing",
  };
}

export async function touchGrowthAiContext(
  userId: string,
  patch: Partial<ContextJson>
): Promise<void> {
  const open = await prisma.growthAiConversation.findFirst({
    where: { userId, status: "open" },
    orderBy: { updatedAt: "desc" },
  });
  if (!open) return;
  const prev = (open.contextJson as ContextJson | null) ?? {};
  await prisma.growthAiConversation.update({
    where: { id: open.id },
    data: { contextJson: { ...prev, ...patch } as object },
  });
}

/**
 * Record an inbound user line, open or continue a growth AI thread, and mark pending for the worker.
 */
export async function recordGrowthAiUserInbound(options: {
  userId: string;
  messageText: string;
  channel?: string;
  contextPatch?: Partial<ContextJson>;
}): Promise<{ conversationId: string; messageId: string }> {
  const { userId, messageText, channel = "in_app", contextPatch } = options;

  let conv = await prisma.growthAiConversation.findFirst({
    where: { userId, status: "open" },
    orderBy: { updatedAt: "desc" },
  });

  if (!conv) {
    const hint = await inferFlowHintFromUser(userId);
    conv = await prisma.growthAiConversation.create({
      data: {
        userId,
        channel,
        status: "open",
        contextJson: { flow_hint: hint, ...(contextPatch ?? {}) } as object,
        aiReplyPending: true,
        outcome: "new",
        lastUserMessageAt: new Date(),
      },
    });
  } else {
    const prev = (conv.contextJson as ContextJson | null) ?? {};
    await prisma.growthAiConversation.update({
      where: { id: conv.id },
      data: {
        contextJson: { ...prev, ...(contextPatch ?? {}) } as object,
        aiReplyPending: true,
        lastUserMessageAt: new Date(),
        ...(conv.outcome ? {} : { outcome: "new" }),
      },
    });
  }

  const userPriorRows = await prisma.growthAiConversationMessage.findMany({
    where: { conversationId: conv.id, senderType: "user" },
    orderBy: { createdAt: "asc" },
    select: { messageText: true },
  });
  const priorUserTextsForClassify = userPriorRows.map((r) => r.messageText);
  const classifierCtx = await buildClassifierContext(userId, priorUserTextsForClassify, {
    conversationId: conv.id,
    humanTakeoverAt: conv.humanTakeoverAt,
  });
  const ctxJson = (conv.contextJson as ContextJson | null) ?? {};
  if (ctxJson.flow_hint) classifierCtx.flowHint = ctxJson.flow_hint;
  if (ctxJson.last_action === "checkout_started") classifierCtx.checkoutStarted = true;
  if (ctxJson.last_action === "listing_view" || ctxJson.last_action === "inquiry") {
    classifierCtx.listingRecentlyViewed = true;
  }
  if (ctxJson.last_action === "inquiry") classifierCtx.inquirySent = true;

  const classifiedInbound = classifyInbound(messageText, classifierCtx);

  const msg = await prisma.growthAiConversationMessage.create({
    data: {
      conversationId: conv.id,
      senderType: "user",
      messageText,
      detectedIntent: classifiedInbound.detectedIntent,
      detectedObjection: classifiedInbound.detectedObjection,
      confidence: classifiedInbound.confidence,
      handoffRequired: classifiedInbound.handoffRequired,
    },
  });

  await prisma.growthAiConversation.update({
    where: { id: conv.id },
    data: {
      highIntent: classifiedInbound.highIntent || conv.highIntent,
    },
  });

  await refreshGrowthAiConversationStage(conv.id, "user_inbound");

  await updateGrowthAiOutcome(conv.id, "user_replied");

  const recentTwo = await prisma.growthAiConversationMessage.findMany({
    where: { conversationId: conv.id },
    orderBy: { createdAt: "desc" },
    take: 2,
  });
  const prior = recentTwo.find((m) => m.id !== msg.id);
  if (prior?.senderType === "ai") {
    const wasNudge =
      prior.isNudge ||
      prior.templateKey === "silent_follow_up" ||
      prior.templateKey === "ghosting_follow_up" ||
      prior.templateKey === "assist_close";
    const outcome = wasNudge ? "user_replied_after_nudge" : "user_replied_after_auto";
    await prisma.growthAiConversation.update({
      where: { id: conv.id },
      data: { growthAiOutcome: outcome, growthAiOutcomeAt: new Date() },
    });
  }

  return { conversationId: conv.id, messageId: msg.id };
}

/**
 * Apply one automated reply to pending conversations (called from worker).
 */
export async function processOneGrowthAiReply(conversationId: string): Promise<{
  ok: boolean;
  error?: string;
  skipped?: string;
}> {
  if (!isAiAutoReplyEnabled()) return { ok: false, skipped: "disabled" };

  const conv = await prisma.growthAiConversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  if (!conv || conv.status !== "open" || !conv.aiReplyPending || conv.humanTakeoverAt) {
    return { ok: false, skipped: "not_pending_or_human" };
  }

  if (!conv.userId) {
    return { ok: false, skipped: "no_user" };
  }

  const last = conv.messages[conv.messages.length - 1];
  if (!last || last.senderType !== "user") {
    return { ok: false, skipped: "last_not_user" };
  }

  const now = Date.now();
  if (conv.lastAutomatedAt && now - conv.lastAutomatedAt.getTime() < 24 * 60 * 60 * 1000) {
    const afterAuto = conv.messages.filter((m) => m.createdAt > conv.lastAutomatedAt!);
    const userAfter = afterAuto.some((m) => m.senderType === "user");
    if (!userAfter) return { ok: false, skipped: "rate_24h" };
  }

  const userMsgs = conv.messages.filter((m) => m.senderType === "user").map((m) => m.messageText);
  const priorUserTexts = userMsgs.slice(0, -1);
  const ctxJson = (conv.contextJson as ContextJson | null) ?? {};
  const classifierCtx = await buildClassifierContext(conv.userId, priorUserTexts, {
    conversationId: conv.id,
    humanTakeoverAt: conv.humanTakeoverAt,
  });
  if (ctxJson.flow_hint) classifierCtx.flowHint = ctxJson.flow_hint;
  if (ctxJson.last_action === "checkout_started") classifierCtx.checkoutStarted = true;
  if (ctxJson.last_action === "listing_view" || ctxJson.last_action === "inquiry") {
    classifierCtx.listingRecentlyViewed = true;
  }
  if (ctxJson.last_action === "inquiry") classifierCtx.inquirySent = true;

  const classified = classifyInbound(last.messageText, classifierCtx);
  const handoffRequired = classified.handoffRequired;

  await refreshGrowthAiConversationStage(conv.id, "worker_pre_reply");
  const stageRow = await prisma.growthAiConversation.findUnique({
    where: { id: conv.id },
    select: { stage: true },
  });
  const funnelStage = (stageRow?.stage ?? "new") as GrowthAiFunnelStage;

  const includePrice = process.env.AI_AUTO_REPLY_INCLUDE_PRICE === "1";
  let objectionForReply = classified.detected_objection;
  if (!includePrice && objectionForReply === "price") {
    objectionForReply = "uncertainty";
  }
  objectionForReply = applyCheckoutTemplateBias(classified.detected_intent, objectionForReply, classifierCtx);

  const userMsgCount = userMsgs.length;
  const pressureScore = computePressureScore({
    highIntent: classified.high_intent,
    userRepliedAgain: userMsgCount >= 2,
    objectionNotNone: objectionForReply !== "none",
    checkoutStarted: Boolean(classifierCtx.checkoutStarted),
    repeatedUserMessages: userMsgCount >= 3,
  });
  logInfo(`Pressure score: ${pressureScore}`, { conversationId: conv.id, userId: conv.userId });

  const closingPushAlready = await prisma.growthAiConversationMessage.count({
    where: { conversationId: conv.id, senderType: "ai", templateKey: "closing_push" },
  });
  const outcomeBlockClosingPush = ["booked", "call_scheduled", "qualified", "handoff", "lost", "stale"].includes(
    conv.outcome ?? ""
  );
  const qualifyClosingPush =
    !handoffRequired &&
    userMsgCount >= 2 &&
    !classifierCtx.inquirySent &&
    !classifierCtx.checkoutStarted &&
    !outcomeBlockClosingPush &&
    closingPushAlready === 0;

  const deterministicTemplateKey =
    (await selectTemplateKeyFromClassification({
      intent: classified.detected_intent,
      objection: objectionForReply,
      highIntent: classified.high_intent,
      includePrice,
      stage: funnelStage,
      pressureScore,
    })) ?? "generic_clarify";

  const forcedClosingPush = qualifyClosingPush ? "closing_push" : null;
  if (qualifyClosingPush) {
    logInfo("Closing push triggered", { conversationId: conv.id, userId: conv.userId });
  }

  const escalateTone =
    !handoffRequired &&
    !qualifyClosingPush &&
    (funnelStage === "closing" || pressureScore >= 4);

  const replyCtx = replyContextFromUser(conv.user, ctxJson);

  let generated: Awaited<ReturnType<typeof generateReply>>;
  let decisionPayload: {
    reasonJson: Record<string, unknown>;
    wasExperiment: boolean;
    experimentKey: string | null;
    selectedTemplateKey: string;
  };

  if (handoffRequired) {
    generated = await generateReply({
      intent: classified.detected_intent,
      objection: objectionForReply,
      handoffRequired: true,
      context: replyCtx,
      selectionSource: "default",
    });
    decisionPayload = {
      reasonJson: {
        path: "handoff_safety",
        handoffReason: classified.handoffReason ?? classified.handoff?.reason ?? null,
        classifier: {
          intent: classified.detected_intent,
          objection: classified.detected_objection,
          confidence: classified.confidence,
        },
      },
      wasExperiment: false,
      experimentKey: null,
      selectedTemplateKey: generated.template_key ?? "handoff_ack",
    };
  } else {
    const resolved = await resolveAdaptiveTemplateSelection({
      conversationId: conv.id,
      forcedTemplateKey: forcedClosingPush,
      defaultTemplateKey: deterministicTemplateKey,
      stage: funnelStage,
      intent: classified.detected_intent,
      objection: objectionForReply,
      highIntent: classified.high_intent,
      handoffRequired: false,
      pressureScore,
      classifierSnapshot: {
        intent: classified.detected_intent,
        objection: classified.detected_objection,
        confidence: classified.confidence,
        highIntent: classified.high_intent,
      },
    });

    const escalateForResolved =
      escalateTone && resolved.templateKey !== "closing_push";

    generated = await generateReply({
      intent: classified.detected_intent,
      objection: objectionForReply,
      handoffRequired: false,
      context: replyCtx,
      forcedTemplateKey: resolved.templateKey,
      escalateClosingTone: escalateForResolved,
      selectionSource: resolved.selectionSource,
      experimentKey: resolved.experimentKey,
    });

    decisionPayload = {
      reasonJson: resolved.reasonJson,
      wasExperiment: resolved.selectionSource === "experiment",
      experimentKey: resolved.experimentKey,
      selectedTemplateKey: generated.template_key ?? resolved.templateKey,
    };
  }

  if (classified.high_intent) {
    logInfo("High intent detected", { conversationId: conv.id, userId: conv.userId });
  }

  const runReplyTransaction = async (includeDecision: boolean) => {
    await prisma.$transaction(async (tx) => {
      await tx.growthAiConversationMessage.update({
        where: { id: last.id },
        data: {
          detectedIntent: classified.detected_intent,
          detectedObjection: classified.detected_objection,
          confidence: classified.confidence,
          handoffRequired,
        },
      });

      if (handoffRequired && (classified.handoffReason || classified.handoff?.reason)) {
        await tx.growthAiConversationHandoff.create({
          data: {
            conversationId: conv.id,
            reason: classified.handoffReason ?? classified.handoff?.reason ?? "handoff",
            status: "pending",
          },
        });
      }

      const nowAi = new Date();
      const aiMsg = await tx.growthAiConversationMessage.create({
        data: {
          conversationId: conv.id,
          senderType: "ai",
          messageText: generated.reply_text,
          detectedIntent: classified.detected_intent,
          detectedObjection: classified.detected_objection,
          confidence: classified.confidence,
          handoffRequired,
          templateKey: generated.template_key,
          ctaType: generated.cta_type,
          isAssistClose: false,
        },
      });

      if (includeDecision) {
        await tx.growthAiConversationDecision.create({
          data: {
            conversationId: conv.id,
            messageId: aiMsg.id,
            stage: funnelStage,
            detectedIntent: classified.detected_intent,
            detectedObjection: objectionForReply,
            highIntent: classified.high_intent,
            selectedTemplateKey: decisionPayload.selectedTemplateKey,
            reasonJson: decisionPayload.reasonJson as Prisma.InputJsonValue,
            wasExperiment: decisionPayload.wasExperiment,
            experimentKey: decisionPayload.experimentKey,
            outcomeAtSelection: conv.outcome,
          },
        });
      }

      await tx.growthAiConversation.update({
        where: { id: conv.id },
        data: {
          aiReplyPending: false,
          lastAutomatedAt: nowAi,
          lastAiMessageAt: nowAi,
          updatedAt: nowAi,
          highIntent: classified.high_intent || conv.highIntent,
          growthAiOutcome: handoffRequired ? "handoff_pending" : "auto_replied",
          growthAiOutcomeAt: nowAi,
        },
      });
    });
  };

  try {
    await runReplyTransaction(true);
  } catch (e: unknown) {
    const code = typeof e === "object" && e && "code" in e ? (e as { code: string }).code : "";
    if (code === "P2021") {
      await runReplyTransaction(false);
    } else throw e;
  }

  const tplKey = decisionPayload.selectedTemplateKey;
  try {
    await recordTemplateSent({
      templateKey: tplKey,
      stage: funnelStage,
      detectedIntent: classified.detected_intent,
      detectedObjection: objectionForReply,
      highIntent: classified.high_intent,
    });
  } catch (e: unknown) {
    const code = typeof e === "object" && e && "code" in e ? (e as { code: string }).code : "";
    if (code !== "P2021") throw e;
  }

  if (handoffRequired) {
    await updateGrowthAiOutcome(conv.id, "handoff");
  } else {
    await updateGrowthAiOutcome(conv.id, "first_auto_reply");
  }

  await refreshGrowthAiConversationStage(conv.id, "post_auto_reply");

  return { ok: true };
}

/**
 * High-intent threads: one `assist_close` nudge if the user goes quiet ~2h after the last AI message.
 */
export async function processHighIntentAssistNudgeQueue(limit = 15): Promise<{ sent: number; skipped: number }> {
  if (!isAiAutoReplyEnabled()) return { sent: 0, skipped: 0 };

  const hours = Math.max(0.5, Number(process.env.AI_HIGH_INTENT_ASSIST_NUDGE_AFTER_HOURS ?? 2));
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

  const candidates = await prisma.growthAiConversation.findMany({
    where: {
      status: "open",
      highIntent: true,
      humanTakeoverAt: null,
      highIntentAssistNudgeSentAt: null,
      aiReplyPending: false,
      outcome: { notIn: ["booked", "call_scheduled", "handoff", "lost", "stale"] },
      OR: [
        { lastAiMessageAt: { not: null, lte: cutoff } },
        { lastAiMessageAt: null, lastAutomatedAt: { not: null, lte: cutoff } },
      ],
    },
    take: limit * 4,
    orderBy: { lastAutomatedAt: "asc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  let sent = 0;
  let skipped = 0;

  const tpl = await loadTemplate("assist_close");
  if (!tpl) return { sent: 0, skipped: candidates.length };

  for (const c of candidates) {
    if (sent >= limit) break;

    const pendingHandoff = await prisma.growthAiConversationHandoff.count({
      where: { conversationId: c.id, status: "pending" },
    });
    if (pendingHandoff > 0) {
      skipped++;
      continue;
    }

    const assistAlready = await prisma.growthAiConversationMessage.count({
      where: {
        conversationId: c.id,
        OR: [{ isAssistClose: true }, { templateKey: "assist_close", isNudge: true }],
      },
    });
    if (assistAlready > 0) {
      skipped++;
      continue;
    }

    const lastMsg = await prisma.growthAiConversationMessage.findFirst({
      where: { conversationId: c.id },
      orderBy: { createdAt: "desc" },
    });
    if (!lastMsg || lastMsg.senderType !== "ai" || lastMsg.handoffRequired) {
      skipped++;
      continue;
    }

    const ctxJson = (c.contextJson as ContextJson | null) ?? {};
    const replyCtx = replyContextFromUser(c.user, ctxJson);
    const text = personalizeTemplate(tpl.content, replyCtx);

    const sentAt = new Date();
    await prisma.$transaction([
      prisma.growthAiConversationMessage.create({
        data: {
          conversationId: c.id,
          senderType: "ai",
          messageText: text,
          templateKey: "assist_close",
          ctaType: tpl.ctaType,
          isNudge: true,
          isAssistClose: true,
        },
      }),
      prisma.growthAiConversation.update({
        where: { id: c.id },
        data: {
          highIntentAssistNudgeSentAt: sentAt,
          lastAutomatedAt: sentAt,
          lastAiMessageAt: sentAt,
        },
      }),
    ]);
    sent++;
    logInfo("High intent assist nudge sent", { conversationId: c.id });
  }

  return { sent, skipped };
}
