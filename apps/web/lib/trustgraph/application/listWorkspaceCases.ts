import { prisma } from "@/lib/db";
import type { WorkspaceQueueItemDto } from "@/lib/trustgraph/domain/workspaces";
import { isTrustGraphEnterpriseWorkspacesEnabled, isTrustGraphEnabled } from "@/lib/trustgraph/feature-flags";

export async function listWorkspaceCases(workspaceId: string, limit: number): Promise<WorkspaceQueueItemDto[]> {
  if (!isTrustGraphEnabled() || !isTrustGraphEnterpriseWorkspacesEnabled()) {
    return [];
  }

  const assignments = await prisma.trustgraphWorkspaceCaseAssignment.findMany({
    where: { workspaceId },
    include: {
      case: {
        select: {
          id: true,
          entityType: true,
          entityId: true,
          status: true,
          trustLevel: true,
          readinessLevel: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });

  const out: WorkspaceQueueItemDto[] = assignments.map((a) => ({
    caseId: a.case.id,
    entityType: a.case.entityType,
    entityId: a.case.entityId,
    status: a.case.status,
    trustLevel: a.case.trustLevel,
    readinessLevel: a.case.readinessLevel,
    assignedTo: a.assignedTo,
    priority: a.priority,
    dueAt: a.dueAt?.toISOString() ?? null,
  }));

  if (out.length > 0) return out;

  const links = await prisma.trustgraphComplianceWorkspaceEntityLink.findMany({
    where: { workspaceId, entityType: "LISTING" },
    select: { entityId: true },
  });
  const listingIds = links.map((l) => l.entityId);
  if (listingIds.length === 0) return [];

  const cases = await prisma.verificationCase.findMany({
    where: { entityType: "LISTING", entityId: { in: listingIds } },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });

  return cases.map((c) => ({
    caseId: c.id,
    entityType: c.entityType,
    entityId: c.entityId,
    status: c.status,
    trustLevel: c.trustLevel,
    readinessLevel: c.readinessLevel,
    assignedTo: null,
    priority: "normal",
    dueAt: null,
  }));
}
