import { logInfo } from "@/lib/logger";
import { prisma } from "@/lib/db";
import type { AiObjection } from "@/src/modules/messaging/aiClassifier";

export async function fetchUserMessageStatsForConversations(
  conversationIds: string[]
): Promise<Map<string, { userMessageCount: number; lastObjection: AiObjection | null }>> {
  const map = new Map<string, { userMessageCount: number; lastObjection: AiObjection | null }>();
  if (conversationIds.length === 0) return map;
  for (const id of conversationIds) {
    map.set(id, { userMessageCount: 0, lastObjection: null });
  }

  const counts = await prisma.growthAiConversationMessage.groupBy({
    by: ["conversationId"],
    where: { conversationId: { in: conversationIds }, senderType: "user" },
    _count: { id: true },
  });
  for (const row of counts) {
    const cur = map.get(row.conversationId);
    if (cur) cur.userMessageCount = row._count.id;
  }

  const userRows = await prisma.growthAiConversationMessage.findMany({
    where: { conversationId: { in: conversationIds }, senderType: "user" },
    orderBy: { createdAt: "desc" },
    select: { conversationId: true, detectedObjection: true },
  });
  const seen = new Set<string>();
  for (const m of userRows) {
    if (seen.has(m.conversationId)) continue;
    seen.add(m.conversationId);
    const cur = map.get(m.conversationId);
    if (cur) cur.lastObjection = (m.detectedObjection as AiObjection | null) ?? null;
  }

  return map;
}

/** Funnel stage for adaptive tone + routing (separate from CRM status). */
export type GrowthAiFunnelStage =
  | "new"
  | "engaged"
  | "considering"
  | "high_intent"
  | "closing"
  | "converted"
  | "stale";

export type PressureScoreInput = {
  highIntent: boolean;
  /** User has sent at least one follow-up after their first line (>= 2 user messages). */
  userRepliedAgain: boolean;
  objectionNotNone: boolean;
  checkoutStarted: boolean;
  /** Third+ user message or multiple back-and-forths. */
  repeatedUserMessages: boolean;
};

/**
 * Computed only (not persisted). Spec: +2 HI, +1 replied, +1 objection, +2 checkout, +1 repeated.
 */
export function computePressureScore(input: PressureScoreInput): number {
  let s = 0;
  if (input.highIntent) s += 2;
  if (input.userRepliedAgain) s += 1;
  if (input.objectionNotNone) s += 1;
  if (input.checkoutStarted) s += 2;
  if (input.repeatedUserMessages) s += 1;
  return s;
}

export function deriveConversationStage(input: {
  outcome: string | null;
  userMessageCount: number;
  highIntent: boolean;
  lastUserObjection: AiObjection;
}): GrowthAiFunnelStage {
  const o = input.outcome;
  if (o === "booked" || o === "call_scheduled") return "converted";
  if (o === "stale" || o === "lost") return "stale";
  if (input.userMessageCount <= 0) return "new";
  if (input.highIntent && input.userMessageCount >= 2) return "closing";
  if (input.highIntent) return "high_intent";
  if (input.lastUserObjection !== "none") return "considering";
  return "engaged";
}

export async function refreshGrowthAiConversationStage(
  conversationId: string,
  logLabel?: string
): Promise<GrowthAiFunnelStage | null> {
  const conv = await prisma.growthAiConversation.findUnique({
    where: { id: conversationId },
    select: {
      outcome: true,
      highIntent: true,
      stage: true,
    },
  });
  if (!conv) return null;

  const userMessageCount = await prisma.growthAiConversationMessage.count({
    where: { conversationId, senderType: "user" },
  });

  const lastUser = await prisma.growthAiConversationMessage.findFirst({
    where: { conversationId, senderType: "user" },
    orderBy: { createdAt: "desc" },
    select: { detectedObjection: true },
  });
  const lastObj = (lastUser?.detectedObjection ?? "none") as AiObjection;

  const next = deriveConversationStage({
    outcome: conv.outcome,
    userMessageCount,
    highIntent: conv.highIntent,
    lastUserObjection: lastObj,
  });

  if (next !== conv.stage) {
    await prisma.growthAiConversation.update({
      where: { id: conversationId },
      data: { stage: next, updatedAt: new Date() },
    });
    logInfo(`Stage updated: ${next}`, { conversationId, ...(logLabel ? { reason: logLabel } : {}) });
  }

  return next;
}

export type ConversationPressureFields = {
  highIntent: boolean;
  outcome: string | null;
  contextJson: unknown;
};

/**
 * Server-side pressure score for admin list (matches worker logic).
 */
export function computePressureScoreForConversation(
  conv: ConversationPressureFields,
  stats: { userMessageCount: number; lastUserObjection: AiObjection | null }
): number {
  const ctx = (conv.contextJson as { last_action?: string } | null) ?? {};
  const coStarted = ctx.last_action === "checkout_started";

  return computePressureScore({
    highIntent: conv.highIntent,
    userRepliedAgain: stats.userMessageCount >= 2,
    objectionNotNone: (stats.lastUserObjection ?? "none") !== "none",
    checkoutStarted: coStarted,
    repeatedUserMessages: stats.userMessageCount >= 3,
  });
}
