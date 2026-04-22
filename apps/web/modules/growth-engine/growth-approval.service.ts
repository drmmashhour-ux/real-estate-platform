import { prisma } from "@/lib/db";

import type { GrowthProposedActionVm } from "./growth-engine.types";

const TYPE_PREFIX = "growth_engine:";

export async function queueGrowthActionForApproval(
  action: GrowthProposedActionVm,
  runBatchId: string,
): Promise<string> {
  const row = await prisma.marketplaceAutonomyApproval.create({
    data: {
      status: "pending",
      actionType: `${TYPE_PREFIX}${action.action}`,
      riskTier: "L3",
      payload: {
        runBatchId,
        signal: action.signal,
        action: action.action,
        entityKind: action.entityKind,
        entityId: action.entityId,
        explanation: action.explanation,
        payload: action.payload,
        signalRefId: action.signalRefId,
      } as object,
      summary: action.explanation.slice(0, 500),
    },
  });
  return row.id;
}

export async function listPendingGrowthApprovals(take = 30) {
  return prisma.marketplaceAutonomyApproval.findMany({
    where: {
      status: "pending",
      actionType: { startsWith: TYPE_PREFIX },
    },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export function toApprovalRowVm(r: { id: string; status: string; actionType: string; riskTier: string; summary: string | null; createdAt: Date }) {
  return {
    id: r.id,
    status: r.status,
    actionType: r.actionType,
    riskTier: r.riskTier,
    summary: r.summary,
    createdAt: r.createdAt.toISOString(),
  };
}
