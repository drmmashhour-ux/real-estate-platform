import { prisma } from "@/lib/db";

export type PendingApprovalSummary = {
  id: string;
  domain: string;
  actionType: string;
  entityType: string;
  entityId: string | null;
  riskLevel: string;
  proposedChange: any;
  rationale: string | null;
  createdAt: Date;
};

export async function listPendingApprovals(): Promise<PendingApprovalSummary[]> {
  const pending = await prisma.autonomousActionQueue.findMany({
    where: {
      status: "QUEUED",
      requiresApproval: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      domain: true,
      actionType: true,
      entityType: true,
      entityId: true,
      riskLevel: true,
      candidateJson: true,
      rationale: true,
      createdAt: true,
    },
  });

  return pending.map((p) => ({
    id: p.id,
    domain: p.domain,
    actionType: p.actionType,
    entityType: p.entityType,
    entityId: p.entityId,
    riskLevel: p.riskLevel,
    proposedChange: p.candidateJson,
    rationale: p.rationale,
    createdAt: p.createdAt,
  }));
}
