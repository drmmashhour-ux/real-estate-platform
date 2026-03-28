import { prisma } from "@/lib/db";
import { logAiEvent } from "@/lib/ai/log";
import {
  detectChatIntent,
  detectStrongBrokerHandoffIntent,
  extractContactFromText,
  generateImmoChatReply,
  shouldAutoCreateLead,
} from "@/lib/ai/chatbot";
import { runClosingAutomationById } from "@/lib/automation/closing-engine";
import { mergeMetadata, parseMetadata } from "@/lib/immo/crm-metadata";
import { createLeadFromImmoChat } from "@/lib/immo/create-chat-lead";
import { sendDashboardNotification } from "@/lib/notifications";
import { appendLeadTimelineEvent } from "@/lib/leads/timeline-helpers";
import { refreshCrmConversationExecution } from "@/src/modules/crm/conversationExecutionRefresh";

export type CrmChatRequestBody = {
  message: string;
  conversationId?: string | null;
  guestSessionId?: string | null;
  contact?: { name?: string; email?: string; phone?: string };
};

export type CrmChatResult = {
  reply: string;
  conversationId: string;
  leadCreated: boolean;
  leadId?: string | null;
  intent?: string;
};

async function maybePingExpertOnUserMessage(params: {
  conversationId: string;
  expertId: string | null;
  leadId: string | null;
  snippet: string;
  metadata: unknown;
}) {
  if (!params.expertId) return;
  const meta = parseMetadata(params.metadata);
  const last = meta.lastExpertMessagePingAt
    ? new Date(meta.lastExpertMessagePingAt).getTime()
    : 0;
  if (Date.now() - last < 90_000) return;

  await prisma.crmConversation.update({
    where: { id: params.conversationId },
    data: {
      metadata: mergeMetadata(params.metadata, {
        lastExpertMessagePingAt: new Date().toISOString(),
      }) as object,
    },
  });

  void sendDashboardNotification({
    mortgageExpertId: params.expertId,
    leadId: params.leadId,
    kind: "immo_chat_message",
    title: "Client messaged in Immo chat",
    body: params.snippet.slice(0, 500),
  });
}

export async function processCrmChatMessage(
  input: CrmChatRequestBody,
  platformUserId: string | null
): Promise<CrmChatResult> {
  const rawMsg = typeof input.message === "string" ? input.message.trim().slice(0, 8000) : "";
  if (!rawMsg) {
    return {
      reply: "Send me a question about buying, renting, or mortgages — I'm here to help.",
      conversationId: input.conversationId ?? "",
      leadCreated: false,
    };
  }

  const guestSessionId =
    typeof input.guestSessionId === "string" && input.guestSessionId.length > 8
      ? input.guestSessionId.slice(0, 128)
      : null;

  if (!platformUserId && !guestSessionId) {
    throw new Error("GUEST_REQUIRED");
  }

  let conversationId = typeof input.conversationId === "string" ? input.conversationId : null;

  if (conversationId) {
    const existing = await prisma.crmConversation.findUnique({
      where: { id: conversationId },
      select: { id: true, userId: true, guestSessionId: true },
    });
    if (!existing) conversationId = null;
    else if (platformUserId && existing.userId && existing.userId !== platformUserId) {
      throw new Error("FORBIDDEN_CONVERSATION");
    } else if (
      !platformUserId &&
      guestSessionId &&
      existing.guestSessionId &&
      existing.guestSessionId !== guestSessionId
    ) {
      throw new Error("FORBIDDEN_CONVERSATION");
    }
  }

  if (!conversationId) {
    const created = await prisma.crmConversation.create({
      data: {
        userId: platformUserId ?? undefined,
        guestSessionId: !platformUserId ? guestSessionId ?? undefined : undefined,
        metadata: {},
      },
      select: { id: true },
    });
    conversationId = created.id;
  } else if (platformUserId) {
    await prisma.crmConversation.updateMany({
      where: { id: conversationId, userId: null },
      data: { userId: platformUserId },
    });
  }

  const convo = await prisma.crmConversation.findUniqueOrThrow({
    where: { id: conversationId },
    include: {
      messages: { orderBy: { createdAt: "asc" }, take: 40, select: { sender: true, content: true } },
    },
  });

  const meta = mergeMetadata(convo.metadata, {});
  const fromContact = input.contact ?? {};
  const fromText = extractContactFromText(rawMsg);
  const capture = {
    ...meta.capture,
    ...fromContact,
    ...fromText,
  };

  const intent = detectChatIntent(rawMsg);
  const nextMeta = mergeMetadata(convo.metadata, { intent, capture });

  await prisma.crmConversation.update({
    where: { id: conversationId },
    data: { metadata: nextMeta as object },
  });

  await prisma.crmMessage.create({
    data: {
      conversationId,
      sender: "user",
      content: rawMsg,
    },
  });

  const recentLines = [...convo.messages.map((m) => `${m.sender}: ${m.content}`), `user: ${rawMsg}`];

  let leadCreated = false;
  let leadId: string | null = convo.leadId ?? null;

  const wantsLead =
    shouldAutoCreateLead(rawMsg) ||
    intent === "expert" ||
    (Boolean(capture.email) && Boolean(capture.name));

  if (!leadId && wantsLead) {
    try {
      const summary = recentLines.join("\n").slice(0, 8000);
      const result = await createLeadFromImmoChat({
        conversationId,
        transcriptSummary: summary,
        intent,
        userId: platformUserId,
        capture: {
          name: capture.name,
          email: capture.email,
          phone: capture.phone,
        },
      });
      leadId = result.leadId;
      leadCreated = true;
    } catch (e) {
      console.warn("[immo-chat] lead creation failed", e);
    }
  }

  const refreshed = await prisma.crmConversation.findUniqueOrThrow({
    where: { id: conversationId },
    select: { expertId: true, leadId: true, metadata: true },
  });

  await maybePingExpertOnUserMessage({
    conversationId,
    expertId: refreshed.expertId,
    leadId: refreshed.leadId,
    snippet: rawMsg,
    metadata: refreshed.metadata,
  });

  const reply = await generateImmoChatReply({
    userMessage: rawMsg,
    intent,
    recentLines,
  });

  await prisma.crmMessage.create({
    data: {
      conversationId,
      sender: "ai",
      content: reply,
    },
  });

  logAiEvent("immo_chat_message", {
    conversationId,
    intent,
    leadCreated,
    leadId,
    messageLength: rawMsg.length,
  });

  const brokerHandoffLeadId = refreshed.leadId ?? leadId;
  if (brokerHandoffLeadId && detectStrongBrokerHandoffIntent(rawMsg)) {
    const nextTouch = new Date(Date.now() + 10 * 60 * 1000);
    await prisma.lead
      .update({
        where: { id: brokerHandoffLeadId },
        data: {
          highIntent: true,
          nextActionAt: nextTouch,
          nextFollowUpAt: nextTouch,
          reminderStatus: "pending",
        },
      })
      .catch(() => {});
    await appendLeadTimelineEvent(brokerHandoffLeadId, "chatbot_broker_handoff_intent", {
      intent,
    }).catch(() => {});
    void runClosingAutomationById(brokerHandoffLeadId).catch(() => {});
  }

  void refreshCrmConversationExecution(conversationId).catch(() => {});

  return {
    reply,
    conversationId,
    leadCreated,
    leadId,
    intent,
  };
}

/**
 * Expert sends a message — stores as sender expert; optional timeline note.
 */
export async function appendExpertChatMessage(params: {
  conversationId: string;
  expertUserId: string;
  content: string;
}): Promise<void> {
  const expert = await prisma.mortgageExpert.findUnique({
    where: { userId: params.expertUserId },
    select: { id: true },
  });
  if (!expert) throw new Error("NOT_EXPERT");

  const convo = await prisma.crmConversation.findUnique({
    where: { id: params.conversationId },
    select: { expertId: true, leadId: true },
  });
  if (!convo || convo.expertId !== expert.id) throw new Error("FORBIDDEN");

  const text = params.content.trim().slice(0, 8000);
  if (!text) throw new Error("EMPTY");

  await prisma.crmMessage.create({
    data: {
      conversationId: params.conversationId,
      sender: "expert",
      content: text,
    },
  });

  if (convo.leadId) {
    void appendLeadTimelineEvent(convo.leadId, "immo_chat_expert_message", {
      conversationId: params.conversationId,
      preview: text.slice(0, 200),
    }).catch(() => {});
  }
  void refreshCrmConversationExecution(params.conversationId).catch(() => {});
}
