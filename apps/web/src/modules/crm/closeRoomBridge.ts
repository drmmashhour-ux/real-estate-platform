import { prisma } from "@/lib/db";
import { getLeadRevenueSnapshot } from "@/src/modules/revenue/revenueEngine";

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
  /** Open revenue opportunities (estimated $) for this lead. */
  openRevenueValue: number;
  /** Combined rank hint: priority + revenue weighting (matches CRM queue). */
  closeRoomRank: number;
  revenuePushActions: { key: string; label: string; reason: string }[];
};

const REVENUE_WEIGHT = 0.12;

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
  const rev = await getLeadRevenueSnapshot(leadId);
  const openRevenueValue = rev.openOpportunityValue;
  const closeRoomRank = row.priorityScore + openRevenueValue * REVENUE_WEIGHT;
  return {
    leadId: row.id,
    priorityScore: row.priorityScore,
    intentScore: row.intentScore,
    executionStage: row.executionStage,
    nextBestAction: row.nextBestAction,
    lastActivityAt: row.lastActivityAt,
    openRevenueValue,
    closeRoomRank,
    revenuePushActions: rev.pushActions,
  };
}
