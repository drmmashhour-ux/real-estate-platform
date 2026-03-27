import type { TrustgraphComplianceWorkspaceMember } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isWorkspaceReviewRole } from "@/lib/trustgraph/domain/workspaces";

export async function getActiveMembership(
  workspaceId: string,
  userId: string
): Promise<TrustgraphComplianceWorkspaceMember | null> {
  return prisma.trustgraphComplianceWorkspaceMember.findFirst({
    where: { workspaceId, userId, status: "active" },
  });
}

export function roleCanReview(role: string): boolean {
  return isWorkspaceReviewRole(role);
}

export function roleIsWorkspaceAdmin(role: string): boolean {
  return role === "workspace_admin" || role === "workspace_manager";
}
