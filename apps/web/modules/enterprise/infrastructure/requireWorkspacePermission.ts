import type { PrismaClient } from "@prisma/client";
import { PlatformRole } from "@prisma/client";
import type { WorkspacePermission } from "../domain/workspacePermissions";
import { roleHasPermission } from "../domain/workspacePermissions";

export type WorkspaceAuthResult =
  | { ok: true; userId: string; role: import("@prisma/client").LecipmWorkspaceRole; isPlatformAdmin: boolean }
  | { ok: false; status: 401 | 403 | 404; error: string };

/**
 * Server-only workspace authorization. Platform ADMIN retains super-access.
 * Never use for client-side gating — call from API routes / server actions only.
 */
export async function requireWorkspacePermission(
  db: PrismaClient,
  args: { userId: string | null; workspaceId: string; permission: WorkspacePermission }
): Promise<WorkspaceAuthResult> {
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
  if (user.role === PlatformRole.ADMIN) {
    const workspace = await db.enterpriseWorkspace.findUnique({
      where: { id: args.workspaceId },
      select: { id: true },
    });
    if (!workspace) {
      return { ok: false, status: 404, error: "Workspace not found" };
    }
    const member = await db.enterpriseWorkspaceMember.findFirst({
      where: { workspaceId: args.workspaceId, userId: args.userId },
      select: { role: true },
    });
    const role = member?.role ?? "admin";
    return { ok: true, userId: args.userId, role, isPlatformAdmin: true };
  }

  const member = await db.enterpriseWorkspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId: args.workspaceId, userId: args.userId },
    },
    select: { role: true },
  });
  if (!member) {
    return { ok: false, status: 404, error: "Workspace not found or access denied" };
  }
  if (!roleHasPermission(member.role, args.permission)) {
    return { ok: false, status: 403, error: "Insufficient workspace permissions" };
  }
  return { ok: true, userId: args.userId, role: member.role, isPlatformAdmin: false };
}
