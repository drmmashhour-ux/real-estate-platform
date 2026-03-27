import { LecipmDealHistoryOutcome, type PrismaClient } from "@prisma/client";
import { appendWorkspaceAuditLog } from "@/modules/enterprise/infrastructure/workspaceAuditLogService";
import { recomputeAllBrokersInWorkspace, recomputeWorkspaceBrokerReputation } from "../infrastructure/reputationService";

export type RecordDealOutcomeInput = {
  workspaceId: string;
  dealId: string;
  outcome: "won" | "lost" | "canceled";
  priceCents: number;
  timeline?: Record<string, unknown> | null;
  actorUserId: string;
};

const MAP: Record<string, LecipmDealHistoryOutcome> = {
  won: LecipmDealHistoryOutcome.won,
  lost: LecipmDealHistoryOutcome.lost,
  canceled: LecipmDealHistoryOutcome.canceled,
};

/**
 * Append deal_history and refresh workspace broker reputation. Enforces deal.workspaceId match.
 */
export async function recordDealOutcome(
  db: PrismaClient,
  input: RecordDealOutcomeInput
): Promise<{ ok: true; historyId: string } | { ok: false; error: string; status: 400 | 403 | 404 }> {
  const outcomeEnum = MAP[input.outcome];
  if (!outcomeEnum) {
    return { ok: false, error: "Invalid outcome", status: 400 };
  }

  const deal = await db.deal.findFirst({
    where: { id: input.dealId, workspaceId: input.workspaceId },
    select: { id: true, brokerId: true, workspaceId: true },
  });
  if (!deal) {
    return { ok: false, error: "Deal not found in this workspace", status: 404 };
  }

  const row = await db.lecipmDealHistory.create({
    data: {
      workspaceId: input.workspaceId,
      dealId: deal.id,
      outcome: outcomeEnum,
      priceCents: Math.max(0, Math.floor(input.priceCents)),
      timeline: input.timeline === undefined ? undefined : (input.timeline as object),
    },
  });

  await appendWorkspaceAuditLog(db, {
    workspaceId: input.workspaceId,
    actorUserId: input.actorUserId,
    action: "workspace_setting_change",
    entityType: "deal_history",
    entityId: row.id,
    metadata: { dealId: deal.id, outcome: input.outcome },
  });

  if (deal.brokerId) {
    await recomputeWorkspaceBrokerReputation(db, input.workspaceId, deal.brokerId);
  } else {
    await recomputeAllBrokersInWorkspace(db, input.workspaceId);
  }

  return { ok: true, historyId: row.id };
}
