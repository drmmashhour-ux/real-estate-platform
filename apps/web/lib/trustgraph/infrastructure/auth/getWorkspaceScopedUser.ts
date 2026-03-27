import type { WorkspaceAccess } from "@/lib/trustgraph/infrastructure/auth/requireWorkspaceAccess";

export function workspaceActorUserId(access: WorkspaceAccess): string {
  return access.kind === "platform_admin" ? access.userId : access.member.userId;
}
