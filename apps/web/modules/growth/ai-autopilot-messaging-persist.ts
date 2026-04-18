import type { Prisma } from "@prisma/client";
import type { AiMessagingAssistDraft } from "./ai-autopilot-messaging.types";

/**
 * Merge draft-only assist payload into `Lead.aiExplanation` without removing sibling keys.
 * If existing explanation is not a plain object, replaces with `{ aiMessagingAssist }` only (legacy-safe).
 */
export function mergeAiMessagingAssistIntoExplanation(
  prev: unknown,
  assist: AiMessagingAssistDraft,
): Prisma.InputJsonValue {
  let nextAssist: AiMessagingAssistDraft = assist;
  if (prev && typeof prev === "object" && !Array.isArray(prev)) {
    const oldAm = (prev as Record<string, unknown>).aiMessagingAssist;
    if (oldAm && typeof oldAm === "object" && !Array.isArray(oldAm)) {
      const rs = (oldAm as { reviewState?: unknown }).reviewState;
      const ru = (oldAm as { reviewUpdatedAt?: unknown }).reviewUpdatedAt;
      if (rs === "needs_review" || rs === "reviewed" || rs === "done") {
        nextAssist = {
          ...assist,
          reviewState: rs,
          ...(typeof ru === "string" ? { reviewUpdatedAt: ru } : {}),
        };
      }
    }
    return { ...(prev as Record<string, unknown>), aiMessagingAssist: nextAssist } as Prisma.InputJsonValue;
  }
  return { aiMessagingAssist: nextAssist } as Prisma.InputJsonValue;
}
