import type { TrustgraphComplianceOrgType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { recordPlatformEvent } from "@/lib/observability";
import { isTrustGraphEnterpriseWorkspacesEnabled, isTrustGraphEnabled } from "@/lib/trustgraph/feature-flags";

export async function createComplianceWorkspaceRecord(args: {
  orgType: TrustgraphComplianceOrgType;
  orgId: string;
  name: string;
  branding?: object | null;
  settings?: object | null;
  creatorUserId: string;
}): Promise<{ workspaceId: string } | { skipped: true }> {
  if (!isTrustGraphEnabled() || !isTrustGraphEnterpriseWorkspacesEnabled()) {
    return { skipped: true };
  }

  const ws = await prisma.trustgraphComplianceWorkspace.create({
    data: {
      orgType: args.orgType,
      orgId: args.orgId,
      name: args.name,
      branding: args.branding ?? undefined,
      settings: args.settings ?? undefined,
      members: {
        create: {
          userId: args.creatorUserId,
          role: "workspace_admin",
          status: "active",
        },
      },
    },
    select: { id: true },
  });

  void recordPlatformEvent({
    eventType: "trustgraph_workspace_created",
    sourceModule: "trustgraph",
    entityType: "COMPLIANCE_WORKSPACE",
    entityId: ws.id,
    payload: { orgType: args.orgType, orgId: args.orgId },
  }).catch(() => {});

  return { workspaceId: ws.id };
}

export async function getComplianceWorkspaceById(workspaceId: string) {
  return prisma.trustgraphComplianceWorkspace.findUnique({
    where: { id: workspaceId },
    include: {
      members: { where: { status: "active" }, select: { userId: true, role: true } },
    },
  });
}
