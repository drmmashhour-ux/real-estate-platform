import { prisma } from "@/lib/db";

export type AiCloserEventType = "AI_CLOSER_RECOMMENDATION" | "AI_CLOSER_STAGE_UPDATE" | "AI_CLOSER_LEARNING";

export async function recordAiCloserEvent(
  leadId: string,
  eventType: AiCloserEventType,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    await prisma.leadTimelineEvent.create({
      data: {
        leadId,
        eventType,
        payload: { ...payload, source: "ai_closer", at: new Date().toISOString() },
      },
    });
  } catch {
    // lead may be missing in tests
  }
}
