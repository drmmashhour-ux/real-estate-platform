import { prisma } from "@/lib/db";

/**
 * Shared payload for a future “Close Room” surface — uses execution layer fields.
 * Import this from close-room UI when built; keeps CRM ↔ close room synchronized.
 */
export type CloseRoomCrmPayload = {
  leadId: string;
  priorityScore: number;
  intentScore: number;
  executionStage: string;
  nextBestAction: string | null;
  lastActivityAt: Date | null;
};

export async function getCloseRoomCrmPayload(leadId: string): Promise<CloseRoomCrmPayload | null> {
  const row = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      id: true,
      priorityScore: true,
      intentScore: true,
      executionStage: true,
      nextBestAction: true,
      lastActivityAt: true,
    },
  });
  if (!row) return null;
  return {
    leadId: row.id,
    priorityScore: row.priorityScore,
    intentScore: row.intentScore,
    executionStage: row.executionStage,
    nextBestAction: row.nextBestAction,
    lastActivityAt: row.lastActivityAt,
  };
}
