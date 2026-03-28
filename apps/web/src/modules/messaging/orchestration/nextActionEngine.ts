import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { loadTemplate, personalizeTemplate, type ReplyContext } from "@/src/modules/messaging/aiReplyEngine";
import { updateGrowthAiOutcome } from "@/src/modules/messaging/outcomes";
import { logGrowthAiOrchestrationAction } from "@/src/modules/messaging/orchestration/actionLogger";
import { assignLead, selectAssignee } from "@/src/modules/messaging/orchestration/routingEngine";
import type { RouteType } from "@/src/modules/messaging/orchestration/leadScoring";
import type { GrowthAiConversation, GrowthAiLeadOrchestration } from "@prisma/client";

export type NextActionPlan = {
  nextActionType: string;
  nextActionDueAt: Date;
  userTemplateKey?: string;
};

type PlanState = {
  automationPaused: boolean;
  routeType: RouteType | null;
  leadScore: number;
  urgencyScore: number;
  conversionGoal: string | null;
  assignmentStatus: string;
  assignedBrokerId: string | null;
  assignedHostId: string | null;
  assignedAdminId: string | null;
  listingId: string | null;
  handoffRequired: boolean;
  conversationOutcome: string | null;
  userMessageCount: number;
  highIntent: boolean;
  checkoutStarted: boolean;
  detectedObjection: string;
  detectedIntent: string;
};

export function determineNextAction(state: PlanState): NextActionPlan {
  const now = Date.now();
  const afterAutoReply = new Date(now + 90_000);

  if (state.automationPaused) {
    return { nextActionType: "wait", nextActionDueAt: new Date(now + 60 * 60 * 1000) };
  }

  if (state.conversationOutcome === "booked" || state.assignmentStatus === "converted") {
    return { nextActionType: "wait", nextActionDueAt: new Date(now + 24 * 60 * 60 * 1000) };
  }

  if (state.handoffRequired || state.routeType === "support") {
    return { nextActionType: "handoff_admin", nextActionDueAt: new Date(now) };
  }

  if (state.routeType === "broker_recruitment" || state.routeType === "host_recruitment") {
    return { nextActionType: "handoff_admin", nextActionDueAt: new Date(now) };
  }

  if (
    state.highIntent &&
    state.userMessageCount >= 5 &&
    !["booked", "call_scheduled", "handoff", "lost"].includes(state.conversationOutcome ?? "")
  ) {
    if (state.leadScore >= 7 && !state.assignedBrokerId && state.routeType === "buyer") {
      return { nextActionType: "assign_broker", nextActionDueAt: new Date(now) };
    }
    return { nextActionType: "handoff_admin", nextActionDueAt: new Date(now) };
  }

  if (state.routeType === "booking" && state.leadScore >= 5 && !state.assignedHostId && state.listingId) {
    return { nextActionType: "assign_host", nextActionDueAt: new Date(now) };
  }

  if (state.routeType === "booking" && state.leadScore >= 5 && state.checkoutStarted) {
    return {
      nextActionType: "prompt_booking",
      nextActionDueAt: afterAutoReply,
      userTemplateKey: "booking_complete_now",
    };
  }

  if (state.routeType === "booking" && state.detectedObjection === "trust" && state.leadScore >= 3) {
    return {
      nextActionType: "send_message",
      nextActionDueAt: afterAutoReply,
      userTemplateKey: "trust_with_action",
    };
  }

  if (state.routeType === "buyer" && state.leadScore >= 6) {
    if (!state.assignedBrokerId) {
      return { nextActionType: "assign_broker", nextActionDueAt: new Date(now) };
    }
    if (state.conversionGoal === "visit") {
      return {
        nextActionType: "prompt_call",
        nextActionDueAt: afterAutoReply,
        userTemplateKey: "buyer_visit_prompt",
      };
    }
    return {
      nextActionType: "prompt_call",
      nextActionDueAt: afterAutoReply,
      userTemplateKey: "buyer_call_prompt",
    };
  }

  return { nextActionType: "wait", nextActionDueAt: new Date(now + 20 * 60 * 1000) };
}

type ExecConv = GrowthAiConversation & {
  user: { id: string; name: string | null; email: string } | null;
  messages: { senderType: string; messageText: string; createdAt: Date }[];
};

export async function executeOrchestrationStep(
  orch: GrowthAiLeadOrchestration,
  conv: ExecConv
): Promise<"skipped" | "prompted" | "assigned" | "handed_off" | "wait" | "error"> {
  const action = orch.nextActionType ?? "wait";
  const ctxJson = (conv.contextJson as { city?: string; listing_title?: string } | null) ?? {};
  const replyCtx: ReplyContext = {
    name: conv.user?.name?.trim() || conv.user?.email?.split("@")[0] || "there",
    city: ctxJson.city ?? "your area",
    listing_title: ctxJson.listing_title ?? "this listing",
  };

  if (conv.aiReplyPending && ["send_message", "prompt_booking", "prompt_call"].includes(action)) {
    await prisma.growthAiLeadOrchestration.update({
      where: { id: orch.id },
      data: { nextActionDueAt: new Date(Date.now() + 60_000) },
    });
    return "skipped";
  }

  if (action === "wait") return "wait";

  if (action === "assign_broker" || action === "assign_host") {
    const route = (orch.routeType as RouteType) ?? "buyer";
    const selection = await selectAssignee({
      routeType: route,
      city: ctxJson.city ?? null,
      listingId: orch.listingId,
    });
    const introKey = route === "booking" ? "host_intro_fast" : "broker_intro_fast";
    const intro = await loadTemplate(introKey);
    if (intro && orch.lastOrchestrationTemplateKey !== introKey) {
      const text = personalizeTemplate(intro.content, replyCtx);
      const sentAt = new Date();
      await prisma.$transaction([
        prisma.growthAiConversationMessage.create({
          data: {
            conversationId: conv.id,
            senderType: "ai",
            messageText: text,
            templateKey: introKey,
            ctaType: intro.ctaType,
          },
        }),
        prisma.growthAiConversation.update({
          where: { id: conv.id },
          data: { lastAiMessageAt: sentAt, lastAutomatedAt: sentAt },
        }),
      ]);
      await prisma.growthAiLeadOrchestration.update({
        where: { id: orch.id },
        data: { lastOrchestrationTemplateKey: introKey, lastActionAt: sentAt },
      });
    }
    await assignLead({
      orchestrationId: orch.id,
      conversationId: conv.id,
      selection,
      source: `worker_${action}`,
    });
    await prisma.growthAiLeadOrchestration.update({
      where: { id: orch.id },
      data: {
        nextActionType: "wait",
        nextActionDueAt: new Date(Date.now() + 15 * 60_000),
        lastActionAt: new Date(),
      },
    });
    return "assigned";
  }

  if (action === "handoff_admin") {
    const selection = await selectAssignee({ routeType: "support", city: ctxJson.city ?? null });
    await assignLead({
      orchestrationId: orch.id,
      conversationId: conv.id,
      selection,
      source: "worker_handoff_admin",
    });
    const pending = await prisma.growthAiConversationHandoff.count({
      where: { conversationId: conv.id, status: "pending" },
    });
    if (pending === 0) {
      await prisma.growthAiConversationHandoff.create({
        data: {
          conversationId: conv.id,
          reason: "autonomous_deal_closer_handoff",
          status: "pending",
        },
      });
    }
    const ack = await loadTemplate("handoff_ack");
    if (ack && orch.lastOrchestrationTemplateKey !== "handoff_ack_orchestration") {
      const text = personalizeTemplate(ack.content, replyCtx);
      const sentAt = new Date();
      await prisma.$transaction([
        prisma.growthAiConversationMessage.create({
          data: {
            conversationId: conv.id,
            senderType: "ai",
            messageText: text,
            templateKey: "handoff_ack",
            ctaType: ack.ctaType,
          },
        }),
        prisma.growthAiConversation.update({
          where: { id: conv.id },
          data: {
            lastAiMessageAt: sentAt,
            lastAutomatedAt: sentAt,
          },
        }),
      ]);
    }
    await updateGrowthAiOutcome(conv.id, "handoff");
    await prisma.growthAiLeadOrchestration.update({
      where: { id: orch.id },
      data: {
        assignmentStatus: "handoff",
        nextActionType: "wait",
        nextActionDueAt: new Date(Date.now() + 6 * 60 * 60_000),
        lastActionAt: new Date(),
        lastOrchestrationTemplateKey: "handoff_ack_orchestration",
      },
    });
    await logGrowthAiOrchestrationAction({
      orchestrationId: orch.id,
      conversationId: conv.id,
      actionType: "handoff_admin",
      resultStatus: "ok",
    });
    return "handed_off";
  }

  const userKey =
    action === "send_message"
      ? orch.lastOrchestrationTemplateKey === "trust_with_action"
        ? null
        : "trust_with_action"
      : action === "prompt_booking"
        ? "booking_complete_now"
        : action === "prompt_call"
          ? orch.conversionGoal === "visit"
            ? "buyer_visit_prompt"
            : "buyer_call_prompt"
          : null;

  if (!userKey) return "wait";

  if (orch.lastOrchestrationTemplateKey === userKey) {
    await prisma.growthAiLeadOrchestration.update({
      where: { id: orch.id },
      data: {
        nextActionType: "wait",
        nextActionDueAt: new Date(Date.now() + 30 * 60_000),
      },
    });
    return "skipped";
  }

  const tpl = await loadTemplate(userKey);
  if (!tpl) {
    logInfo("[orchestration] missing template", { userKey, conversationId: conv.id });
    return "error";
  }

  const text = personalizeTemplate(tpl.content, replyCtx);
  const sentAt = new Date();
  await prisma.$transaction([
    prisma.growthAiConversationMessage.create({
      data: {
        conversationId: conv.id,
        senderType: "ai",
        messageText: text,
        templateKey: userKey,
        ctaType: tpl.ctaType,
        isAssistClose: userKey === "booking_complete_now",
      },
    }),
    prisma.growthAiConversation.update({
      where: { id: conv.id },
      data: { lastAiMessageAt: sentAt, lastAutomatedAt: sentAt },
    }),
  ]);

  await prisma.growthAiLeadOrchestration.update({
    where: { id: orch.id },
    data: {
      lastOrchestrationTemplateKey: userKey,
      lastActionAt: sentAt,
      nextActionType: "wait",
      nextActionDueAt: new Date(Date.now() + 25 * 60_000),
    },
  });

  await logGrowthAiOrchestrationAction({
    orchestrationId: orch.id,
    conversationId: conv.id,
    actionType: "orchestration_send",
    resultStatus: "ok",
    actionPayload: { templateKey: userKey },
  });

  return "prompted";
}
