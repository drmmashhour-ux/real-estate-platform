import { trustgraphJsonError } from "@/lib/trustgraph/infrastructure/auth/http";
import { resolveWorkspaceAccess, type WorkspaceAccess } from "@/lib/trustgraph/infrastructure/auth/requireWorkspaceAccess";
import { roleIsWorkspaceAdmin } from "@/lib/trustgraph/infrastructure/services/workspaceMembershipService";

export async function requireWorkspaceAdmin(
  workspaceId: string,
  userId: string
): Promise<WorkspaceAccess | Response> {
  const access = await resolveWorkspaceAccess(workspaceId, userId);
  if (access instanceof Response) return access;
  if (access.kind === "platform_admin") return access;
  if (!roleIsWorkspaceAdmin(access.member.role)) return trustgraphJsonError("Forbidden", 403);
  return access;
}
