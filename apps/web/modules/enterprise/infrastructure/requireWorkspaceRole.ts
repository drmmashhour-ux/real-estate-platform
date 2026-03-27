import type { PrismaClient } from "@prisma/client";
import { LecipmWorkspaceRole, PlatformRole } from "@prisma/client";

export type WorkspaceRoleAuthResult =
  | { ok: true; userId: string; role: LecipmWorkspaceRole; isPlatformAdmin: boolean }
  | { ok: false; status: 401 | 403 | 404; error: string };

/**
 * Require membership with one of `allowedRoles` (or platform ADMIN).
 */
export async function requireWorkspaceRole(
  db: PrismaClient,
  args: {
    userId: string | null;
    workspaceId: string;
    allowedRoles: LecipmWorkspaceRole[];
  }
): Promise<WorkspaceRoleAuthResult> {
  if (!args.userId?.trim()) {
    return { ok: false, status: 401, error: "Sign in required" };
  }

  const user = await db.user.findUnique({
    where: { id: args.userId },
    select: { role: true },
  });
  if (!user) {
    return { ok: false, status: 401, error: "Invalid session" };
  }

  const member = await db.enterpriseWorkspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId: args.workspaceId, userId: args.userId },
    },
    select: { role: true },
  });

  if (user.role === PlatformRole.ADMIN) {
    if (!member) {
      return { ok: false, status: 404, error: "Workspace not found" };
    }
    return { ok: true, userId: args.userId, role: member.role, isPlatformAdmin: true };
  }

  if (!member) {
    return { ok: false, status: 404, error: "Workspace not found or access denied" };
  }
  if (!args.allowedRoles.includes(member.role)) {
    return { ok: false, status: 403, error: "Insufficient workspace role" };
  }
  return { ok: true, userId: args.userId, role: member.role, isPlatformAdmin: false };
}
