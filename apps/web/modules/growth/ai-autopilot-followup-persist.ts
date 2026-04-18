import type { Prisma } from "@prisma/client";
import type { AiFollowUpState } from "./ai-autopilot-followup.types";

export function parseAiFollowUpFromExplanation(explanation: unknown): AiFollowUpState | null {
  if (!explanation || typeof explanation !== "object" || Array.isArray(explanation)) return null;
  const raw = (explanation as Record<string, unknown>).aiFollowUp;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  if (o.version !== "v1") return null;
  const status = o.status;
  if (
    status !== "new" &&
    status !== "queued" &&
    status !== "due_now" &&
    status !== "waiting" &&
    status !== "done"
  ) {
    return null;
  }
  const updatedAt = typeof o.updatedAt === "string" ? o.updatedAt : null;
  if (!updatedAt) return null;
  return {
    version: "v1",
    status,
    nextActionAt: typeof o.nextActionAt === "string" ? o.nextActionAt : undefined,
    followUpPriority:
      o.followUpPriority === "low" || o.followUpPriority === "medium" || o.followUpPriority === "high"
        ? o.followUpPriority
        : undefined,
    reminderReason: typeof o.reminderReason === "string" ? o.reminderReason : undefined,
    queueScore: typeof o.queueScore === "number" && Number.isFinite(o.queueScore) ? o.queueScore : undefined,
    updatedAt,
  };
}

/**
 * Merge follow-up snapshot into `Lead.aiExplanation` without removing sibling keys (e.g. aiMessagingAssist).
 */
export function mergeAiFollowUpIntoExplanation(prev: unknown, followUp: AiFollowUpState): Prisma.InputJsonValue {
  if (prev && typeof prev === "object" && !Array.isArray(prev)) {
    return { ...(prev as Record<string, unknown>), aiFollowUp: followUp } as Prisma.InputJsonValue;
  }
  return { aiFollowUp: followUp } as Prisma.InputJsonValue;
}
