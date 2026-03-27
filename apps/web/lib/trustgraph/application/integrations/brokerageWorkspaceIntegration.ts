import { prisma } from "@/lib/db";
import { isTrustGraphEnterpriseWorkspacesEnabled, isTrustGraphEnabled } from "@/lib/trustgraph/feature-flags";

/** Link a brokerage org (MortgageBroker id) to a compliance workspace for scoped reviews. */
export async function linkBrokerageToWorkspace(args: { workspaceId: string; mortgageBrokerId: string }) {
  if (!isTrustGraphEnabled() || !isTrustGraphEnterpriseWorkspacesEnabled()) {
    return { skipped: true as const };
  }
  await prisma.trustgraphComplianceWorkspaceEntityLink.create({
    data: {
      workspaceId: args.workspaceId,
      entityType: "MORTGAGE_BROKER",
      entityId: args.mortgageBrokerId,
      relationType: "org_primary",
    },
  });
  return { ok: true as const };
}
