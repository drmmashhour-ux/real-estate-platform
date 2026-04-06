import { z } from "zod";
import { openai, isOpenAiConfigured } from "@/lib/ai/openai";
import { MANAGER_AI_CHAT_MODEL } from "./config";
import type { AgentKey, DecisionMode, ManagerAiContext, OrchestratorResult, StructuredAgentOutput } from "./types";
import { routeAgentKey } from "./routing/agent-router";
import { getAgentSystemPrompt } from "./prompts/registry";
import { decisionModeForAutopilot, effectiveAutopilotMode } from "./permissions";
import { getManagerAiPlatformSettings } from "@/lib/manager-ai/platform-settings";
import { prisma } from "@/lib/db";
import { loadConversationMessages } from "./memory/session-memory";
import { buildUserMemoryFromRole } from "./memory/user-memory";
import {
  toolGetAdminMetrics,
  toolGetBookingById,
  toolGetBookingsForGuest,
  toolGetBookingsForHost,
  toolGetCurrentUserContext,
  toolGetListingById,
  toolGetListingsForHost,
  toolGetPaymentStatus,
  toolGetPayoutStatus,
} from "./tools/registry";
import { logManagerAgentRun } from "./logger";
import { normalizeConfidence } from "./confidence";
import { withComplianceDisclaimer } from "./policies/compliance-policy";
import { getUserUiLocaleCode } from "@/lib/i18n/user-ui-locale";
import { buildAiSystemLanguageAppendix } from "@/lib/i18n/ai-response-locale";
import { translateServer } from "@/lib/i18n/server-translate";
import { isLocaleCode, type LocaleCode } from "@/lib/i18n/locales";

const RecommendedActionZ = z.object({
  id: z.string(),
  label: z.string(),
  actionKey: z.string(),
  requiresApproval: z.boolean(),
  payload: z.record(z.string(), z.unknown()).optional(),
});

const StructuredZ = z.object({
  summary: z.string(),
  reasoning_short: z.string(),
  confidence: z.number(),
  recommended_actions: z.array(RecommendedActionZ).max(12).optional().default([]),
  requiresApproval: z.boolean(),
  disclaimers: z.array(z.string()).optional(),
});

function parseStructured(raw: string): StructuredAgentOutput | null {
  const trimmed = raw.trim();
  const jsonStart = trimmed.indexOf("{");
  const jsonEnd = trimmed.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1) return null;
  try {
    const parsed = JSON.parse(trimmed.slice(jsonStart, jsonEnd + 1)) as unknown;
    const r = StructuredZ.safeParse(parsed);
    if (!r.success) return null;
    return {
      summary: r.data.summary,
      reasoning_short: r.data.reasoning_short,
      confidence: normalizeConfidence(r.data.confidence),
      recommended_actions: r.data.recommended_actions ?? [],
      requiresApproval: r.data.requiresApproval,
      disclaimers: r.data.disclaimers,
    };
  } catch {
    return null;
  }
}

async function buildContextJson(input: {
  userId: string;
  role: string;
  ctx: ManagerAiContext;
  isAdmin: boolean;
}): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = {
    role: input.role,
    surface: input.ctx.surface ?? "web",
    listingId: input.ctx.listingId ?? null,
    bookingId: input.ctx.bookingId ?? null,
  };

  const u = await toolGetCurrentUserContext(input.userId);
  if (u.ok) {
    out.user = u.data;
    out.userMemory = buildUserMemoryFromRole(u.data.role, u.data.shortTermListingCount);
  }

  if (input.ctx.listingId) {
    const l = await toolGetListingById(input.userId, input.ctx.listingId);
    if (l.ok) out.listing = l.data;
  } else if (u.ok && u.data.shortTermListingCount > 0) {
    const list = await toolGetListingsForHost(input.userId);
    if (list.ok) out.hostListingsPreview = list.data.slice(0, 5);
  }

  if (input.ctx.bookingId) {
    const b = await toolGetBookingById(input.userId, input.ctx.bookingId);
    if (b.ok) {
      out.booking = b.data;
      const pay = await toolGetPaymentStatus(input.userId, input.ctx.bookingId);
      if (pay.ok) out.payment = pay.data;
    }
  } else {
    const g = await toolGetBookingsForGuest(input.userId);
    if (g.ok && g.data.length) out.guestBookingsPreview = g.data.slice(0, 5);
    if (u.ok && u.data.shortTermListingCount > 0) {
      const hb = await toolGetBookingsForHost(input.userId);
      if (hb.ok) out.hostBookingsPreview = hb.data.slice(0, 5);
    }
  }

  const payout = await toolGetPayoutStatus(input.userId);
  if (payout.ok) out.payoutReadiness = payout.data;

  if (input.isAdmin) {
    const m = await toolGetAdminMetrics(input.userId);
    if (m.ok) out.adminMetrics = m.data;
  }

  return out;
}

export async function runLecipmManagerChat(input: {
  userId: string;
  role: string;
  message: string;
  conversationId?: string | null;
  context: ManagerAiContext;
  agentKey?: AgentKey | null;
  isAdmin: boolean;
  uiLocaleHint?: LocaleCode | null;
}): Promise<OrchestratorResult> {
  const rawCtxLoc = input.context.uiLocale?.trim();
  const fromCtx = rawCtxLoc && isLocaleCode(rawCtxLoc) ? rawCtxLoc : undefined;
  const uiLocale: LocaleCode =
    fromCtx ?? input.uiLocaleHint ?? (await getUserUiLocaleCode(input.userId));

  const settings = await getManagerAiPlatformSettings();
  if (settings.globalMode === "OFF") {
    return {
      reply: translateServer(uiLocale, "ai.assistantOff"),
      agentKey: "guest_support",
      decisionMode: "ASSIST_ONLY",
      conversationId: input.conversationId ?? "off",
    };
  }

  const agentKey = routeAgentKey(input.message, input.context, input.agentKey ?? undefined);
  const autopilot = effectiveAutopilotMode(settings.globalMode, settings.agentModes[agentKey]);
  const decisionMode: DecisionMode = decisionModeForAutopilot(autopilot);

  const contextJson = await buildContextJson({
    userId: input.userId,
    role: input.role,
    ctx: input.context,
    isAdmin: input.isAdmin,
  });

  let conversationId = input.conversationId ?? "";
  if (!conversationId) {
    const conv = await prisma.managerAiConversation.create({
      data: {
        userId: input.userId,
        title: input.message.slice(0, 80),
        contextJson: input.context as object,
      },
    });
    conversationId = conv.id;
  } else {
    const exists = await prisma.managerAiConversation.findFirst({
      where: { id: conversationId, userId: input.userId },
    });
    if (!exists) {
      const conv = await prisma.managerAiConversation.create({
        data: {
          userId: input.userId,
          title: input.message.slice(0, 80),
          contextJson: input.context as object,
        },
      });
      conversationId = conv.id;
    }
  }

  await prisma.managerAiMessage.create({
    data: {
      conversationId,
      role: "user",
      content: input.message,
      metadata: { agentKey } as object,
    },
  });

  const history = await loadConversationMessages(conversationId, 20);
  const system = `${getAgentSystemPrompt(agentKey)}\n\n${buildAiSystemLanguageAppendix(uiLocale)}`;
  const userPayload = `DECISION_MODE_HINT: ${decisionMode}\nCONTEXT_JSON:\n${JSON.stringify(contextJson).slice(0, 12000)}\nUSER_MESSAGE:\n${input.message}`;

  const slice = history.slice(-16);
  const openAiMessages = slice.map((m, idx) => {
    const isLastUser = m.role === "user" && idx === slice.length - 1;
    return {
      role: m.role as "user" | "assistant" | "system",
      content: isLastUser ? userPayload : m.content,
    };
  });

  let assistantText = "";
  let structured: StructuredAgentOutput | null = null;

  if (isOpenAiConfigured()) {
    try {
      const completion = await openai.chat.completions.create({
        model: MANAGER_AI_CHAT_MODEL,
        messages: [{ role: "system", content: system }, ...openAiMessages],
        temperature: 0.35,
        max_tokens: 1200,
      });
      assistantText = completion.choices[0]?.message?.content?.trim() ?? "";
      structured = parseStructured(assistantText);
    } catch {
      assistantText = translateServer(uiLocale, "ai.chatUnavailable");
    }
  } else {
    structured = {
      summary: translateServer(uiLocale, "ai.providerNotConfiguredSummary"),
      reasoning_short: translateServer(uiLocale, "ai.providerNotConfiguredReason"),
      confidence: 0.4,
      recommended_actions: [],
      requiresApproval: false,
    };
    assistantText = JSON.stringify(structured);
  }

  let reply = structured?.summary ?? assistantText;
  if (agentKey === "compliance") {
    reply = withComplianceDisclaimer(reply);
  }

  await prisma.managerAiMessage.create({
    data: {
      conversationId,
      role: "assistant",
      content: reply,
      metadata: { agentKey, structured: structured ?? undefined } as object,
    },
  });

  await prisma.managerAiConversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  await logManagerAgentRun({
    userId: input.userId,
    agentKey,
    decisionMode,
    inputSummary: input.message.slice(0, 2000),
    outputSummary: reply.slice(0, 2000),
    confidence: structured?.confidence ?? null,
    status: structured ? "completed" : "completed",
    result: structured ? (structured as unknown as Record<string, unknown>) : { raw: assistantText.slice(0, 4000) },
    targetEntityType: input.context.listingId ? "short_term_listing" : input.context.bookingId ? "booking" : null,
    targetEntityId: input.context.listingId ?? input.context.bookingId ?? null,
  });

  return {
    reply,
    agentKey,
    decisionMode,
    structured: structured ?? undefined,
    conversationId,
  };
}
