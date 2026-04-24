import { logInfo } from "@/lib/logger";
import { prisma } from "@/lib/db";
import { refreshGrowthAiConversationStage } from "@/src/modules/messaging/growthAiStage";
import { applyLearningOutcomeFeedback } from "@/src/modules/messaging/learning/templatePerformance";
import { recordEvolutionOutcome } from "@/modules/evolution/outcome-tracker.service";

export type GrowthOutcome =
  | "new"
  | "replied"
  | "qualified"
  | "booked"
  | "call_scheduled"
  | "handoff"
  | "lost"
  | "stale";

export type GrowthOutcomeEvent =
  | "user_replied"
  | "inquiry_sent"
  | "checkout_completed"
  | "call_scheduled"
  | "handoff"
  | "lost"
  | "stale_idle"
  /** First successful AI outbound on a thread still at new/null (engagement started). */
  | "first_auto_reply";

/** Higher = further in funnel (rough); used to avoid downgrades. */
const OUTCOME_RANK: Record<string, number> = {
  new: 10,
  stale: 12,
  replied: 20,
  qualified: 30,
  handoff: 40,
  call_scheduled: 50,
  booked: 100,
  lost: 200,
};

export function outcomeRank(outcome: string | null | undefined): number {
  if (!outcome) return 0;
  return OUTCOME_RANK[outcome] ?? 0;
}

export function deriveConversationOutcome(
  _current: string | null | undefined,
  eventType: GrowthOutcomeEvent
): GrowthOutcome | null {
  switch (eventType) {
    case "user_replied":
      return "replied";
    case "inquiry_sent":
      return "qualified";
    case "checkout_completed":
      return "booked";
    case "call_scheduled":
      return "call_scheduled";
    case "handoff":
      return "handoff";
    case "lost":
      return "lost";
    case "stale_idle":
      return "stale";
    case "first_auto_reply":
      return "replied";
    default:
      return null;
  }
}

function eventToOutcome(event: GrowthOutcomeEvent): GrowthOutcome | null {
  return deriveConversationOutcome(null, event);
}

function shouldApplyOutcomeUpdate(
  current: string | null | undefined,
  next: GrowthOutcome,
  event: GrowthOutcomeEvent
): boolean {
  const cur = current ?? null;
  if (cur === "lost") return false;
  if (cur === "booked" && next !== "booked") return false;

  if (event === "stale_idle") {
    if (cur === "booked" || cur === "lost") return false;
    return true;
  }

  if (event === "first_auto_reply") {
    return !cur || cur === "new";
  }

  const curR = outcomeRank(cur);
  const nextR = outcomeRank(next);
  if (next === "booked" && cur === "handoff") return true;
  if (nextR > curR) return true;
  if (!cur && nextR >= outcomeRank("new")) return true;
  return false;
}

/** Primary API: map platform events → funnel outcome without weakening stronger states. */
export async function updateGrowthAiOutcome(
  conversationId: string,
  eventType: GrowthOutcomeEvent
): Promise<void> {
  const next = eventToOutcome(eventType);
  if (!next) return;

  const conv = await prisma.growthAiConversation.findUnique({
    where: { id: conversationId },
    select: { outcome: true },
  });
  const current = conv?.outcome;

  if (!shouldApplyOutcomeUpdate(current, next, eventType)) return;

  const data: { outcome: string; updatedAt: Date; staleMarkedAt?: Date } = {
    outcome: next,
    updatedAt: new Date(),
  };
  if (eventType === "stale_idle") {
    data.staleMarkedAt = new Date();
  }

  await prisma.growthAiConversation.update({
    where: { id: conversationId },
    data,
  });
  logInfo(`Outcome updated: ${next}`, { conversationId, eventType });
  await refreshGrowthAiConversationStage(conversationId, `outcome:${eventType}`);

  void recordEvolutionOutcome({
    domain: "MESSAGING",
    metricType: "CONVERSION",
    strategyKey: "lead_conversion",
    entityId: conversationId,
    entityType: "GrowthAiConversation",
    actualJson: { eventType, outcome: next },
    reinforceStrategy: true,
    idempotent: false, // Funnel progression can have multiple events
  }).catch(() => {});

  await applyLearningOutcomeFeedback(conversationId, next, eventType).catch(() => {
    /* learning tables may be missing before migration */
  });
}

/** @deprecated Use updateGrowthAiOutcome — alias for compatibility. */
export const updateOutcome = updateGrowthAiOutcome;

export async function updateOutcomeForOpenConversation(userId: string, event: GrowthOutcomeEvent): Promise<void> {
  const conv = await prisma.growthAiConversation.findFirst({
    where: { userId, status: "open" },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });
  if (!conv) return;
  await updateGrowthAiOutcome(conv.id, event);
}

export async function markHighIntentForOpenConversation(userId: string): Promise<void> {
  await prisma.growthAiConversation.updateMany({
    where: { userId, status: "open" },
    data: { highIntent: true, updatedAt: new Date() },
  });
  logInfo("High intent detected", { userId, source: "context_trigger" });
}

const DEFAULT_STALE_HOURS = 60;

/** Mark open threads with no recent user activity as stale (outcome only). */
export async function maybeMarkConversationStale(conversationId: string): Promise<void> {
  await updateGrowthAiOutcome(conversationId, "stale_idle");
}

export async function markStaleOutcomes(limit = 100): Promise<number> {
  const hours = Math.max(48, Math.min(72, Number(process.env.AI_STALE_OUTCOME_AFTER_HOURS ?? DEFAULT_STALE_HOURS)));
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

  const rows = await prisma.growthAiConversation.findMany({
    where: {
      status: "open",
      lastUserMessageAt: { not: null, lt: cutoff },
      OR: [
        { outcome: null },
        { outcome: { notIn: ["booked", "lost", "stale", "handoff"] } },
      ],
    },
    take: limit,
    select: { id: true, outcome: true },
  });

  let n = 0;
  for (const r of rows) {
    await updateGrowthAiOutcome(r.id, "stale_idle");
    n++;
  }
  return n;
}
