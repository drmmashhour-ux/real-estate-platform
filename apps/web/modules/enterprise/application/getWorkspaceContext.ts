import type { PrismaClient } from "@prisma/client";
import { PlatformRole } from "@prisma/client";
import type { WorkspacePermission } from "../domain/workspacePermissions";
import { ALL_WORKSPACE_PERMISSIONS, WORKSPACE_ROLE_PERMISSIONS } from "../domain/workspacePermissions";

export async function getWorkspaceContext(
  db: PrismaClient,
  args: { userId: string | null; workspaceId: string }
): Promise<{
  workspace: { id: string; name: string; slug: string | null; seatLimit: number; planTier: string } | null;
  memberRole: import("@prisma/client").LecipmWorkspaceRole | null;
  permissions: ReadonlySet<WorkspacePermission>;
  isPlatformAdmin: boolean;
}> {
  if (!args.userId) {
    return { workspace: null, memberRole: null, permissions: new Set(), isPlatformAdmin: false };
  }

  const user = await db.user.findUnique({
    where: { id: args.userId },
    select: { role: true },
  });
  const isPlatformAdmin = user?.role === PlatformRole.ADMIN;

  const workspace = await db.enterpriseWorkspace.findUnique({
    where: { id: args.workspaceId },
    select: { id: true, name: true, slug: true, seatLimit: true, planTier: true },
  });

  if (!workspace) {
    return { workspace: null, memberRole: null, permissions: new Set(), isPlatformAdmin };
  }

  const member = await db.enterpriseWorkspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId: args.workspaceId, userId: args.userId },
    },
    select: { role: true },
  });

  if (!member && !isPlatformAdmin) {
    return { workspace: null, memberRole: null, permissions: new Set(), isPlatformAdmin: false };
  }

  if (isPlatformAdmin && !member) {
    return {
      workspace,
      memberRole: null,
      permissions: new Set(ALL_WORKSPACE_PERMISSIONS),
      isPlatformAdmin: true,
    };
  }

  const role = member!.role;
  const permissions = WORKSPACE_ROLE_PERMISSIONS[role] ?? new Set();

  return {
    workspace,
    memberRole: member?.role ?? null,
    permissions,
    isPlatformAdmin,
  };
}
