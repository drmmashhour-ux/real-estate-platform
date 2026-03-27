import { LecipmDealHistoryOutcome, type PrismaClient } from "@prisma/client";

/**
 * Recompute reputation for one broker using only `deal_history` rows in this workspace.
 */
export async function recomputeWorkspaceBrokerReputation(
  db: PrismaClient,
  workspaceId: string,
  brokerUserId: string
): Promise<void> {
  const histories = await db.lecipmDealHistory.findMany({
    where: {
      workspaceId,
      deal: { brokerId: brokerUserId },
    },
    select: { outcome: true },
  });

  const n = histories.length;
  if (n === 0) {
    await db.workspaceBrokerReputation.deleteMany({ where: { workspaceId, brokerUserId } }).catch(() => {});
    return;
  }

  const won = histories.filter((h) => h.outcome === LecipmDealHistoryOutcome.won).length;
  const successRate = won / n;

  const msgCount = await db.workspaceCollaborationMessage.count({
    where: { workspaceId, authorId: brokerUserId },
  });
  const activityScore = Math.min(100, n * 8 + Math.min(40, msgCount * 2));

  const score = Math.round(Math.min(100, successRate * 70 + activityScore * 0.3));

  await db.workspaceBrokerReputation.upsert({
    where: {
      workspaceId_brokerUserId: { workspaceId, brokerUserId },
    },
    create: {
      workspaceId,
      brokerUserId,
      score,
      successRate,
      activityScore,
      dealsCounted: n,
    },
    update: {
      score,
      successRate,
      activityScore,
      dealsCounted: n,
    },
  });
}

export async function recomputeAllBrokersInWorkspace(db: PrismaClient, workspaceId: string): Promise<void> {
  const brokers = await db.deal.findMany({
    where: { workspaceId, brokerId: { not: null } },
    select: { brokerId: true },
    distinct: ["brokerId"],
  });
  for (const row of brokers) {
    if (row.brokerId) {
      await recomputeWorkspaceBrokerReputation(db, workspaceId, row.brokerId);
    }
  }
}
