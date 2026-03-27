import { prisma } from "@/lib/db";
import { recordPlatformEvent } from "@/lib/observability";
import { isTrustGraphEnterpriseWorkspacesEnabled, isTrustGraphEnabled } from "@/lib/trustgraph/feature-flags";

export async function assignWorkspaceReviewer(args: {
  workspaceId: string;
  caseId: string;
  assignedTo: string;
  assignedBy: string;
  priority?: string;
  dueAt?: Date | null;
}): Promise<{ ok: true } | { skipped: true }> {
  if (!isTrustGraphEnabled() || !isTrustGraphEnterpriseWorkspacesEnabled()) {
    return { skipped: true };
  }

  await prisma.trustgraphWorkspaceCaseAssignment.upsert({
    where: {
      workspaceId_caseId: { workspaceId: args.workspaceId, caseId: args.caseId },
    },
    create: {
      workspaceId: args.workspaceId,
      caseId: args.caseId,
      assignedTo: args.assignedTo,
      assignedBy: args.assignedBy,
      priority: args.priority ?? "normal",
      dueAt: args.dueAt ?? undefined,
    },
    update: {
      assignedTo: args.assignedTo,
      assignedBy: args.assignedBy,
      priority: args.priority ?? "normal",
      dueAt: args.dueAt ?? undefined,
    },
  });

  void recordPlatformEvent({
    eventType: "trustgraph_workspace_case_assigned",
    sourceModule: "trustgraph",
    entityType: "VERIFICATION_CASE",
    entityId: args.caseId,
    payload: { workspaceId: args.workspaceId, assignedTo: args.assignedTo },
  }).catch(() => {});

  return { ok: true };
}
