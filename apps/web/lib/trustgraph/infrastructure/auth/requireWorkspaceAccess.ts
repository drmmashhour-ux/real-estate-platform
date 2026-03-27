import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { getGuestId } from "@/lib/auth/session";
import type { TrustgraphComplianceWorkspaceMember } from "@prisma/client";
import { trustgraphJsonError } from "@/lib/trustgraph/infrastructure/auth/http";
import { getActiveMembership } from "@/lib/trustgraph/infrastructure/services/workspaceMembershipService";

export type WorkspaceAccess =
  | { kind: "platform_admin"; userId: string }
  | { kind: "member"; member: TrustgraphComplianceWorkspaceMember };

export async function requireWorkspaceSession(): Promise<{ userId: string } | Response> {
  const userId = await getGuestId();
  if (!userId) return trustgraphJsonError("Unauthorized", 401);
  return { userId };
}

export async function resolveWorkspaceAccess(workspaceId: string, userId: string): Promise<WorkspaceAccess | Response> {
  if (await isPlatformAdmin(userId)) {
    return { kind: "platform_admin", userId };
  }
  const member = await getActiveMembership(workspaceId, userId);
  if (!member) return trustgraphJsonError("Forbidden", 403);
  return { kind: "member", member };
}
