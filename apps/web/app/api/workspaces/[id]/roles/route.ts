import { NextRequest, NextResponse } from "next/server";
import { LecipmWorkspaceRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { appendWorkspaceAuditLog } from "@/modules/enterprise/infrastructure/workspaceAuditLogService";
import { requireWorkspacePermission } from "@/modules/enterprise/infrastructure/requireWorkspacePermission";

type Ctx = { params: Promise<{ id: string }> };

const ROLES = new Set<string>(Object.values(LecipmWorkspaceRole));

export const dynamic = "force-dynamic";

/** POST /api/workspaces/[id]/roles — update member role. */
export async function POST(request: NextRequest, ctx: Ctx) {
  const userId = await getGuestId();
  const { id: workspaceId } = await ctx.params;
  const auth = await requireWorkspacePermission(prisma, {
    userId,
    workspaceId,
    permission: "manage_members",
  });
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await request.json().catch(() => ({}))) as { userId?: string; role?: string };
  const targetUserId = typeof body.userId === "string" ? body.userId.trim() : "";
  const roleRaw = typeof body.role === "string" ? body.role.trim() : "";
  if (!targetUserId || !roleRaw || !ROLES.has(roleRaw)) {
    return NextResponse.json({ error: "userId and valid role required" }, { status: 400 });
  }

  const member = await prisma.enterpriseWorkspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId, userId: targetUserId },
    },
  });
  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }
  if (member.role === LecipmWorkspaceRole.owner && roleRaw !== LecipmWorkspaceRole.owner) {
    return NextResponse.json({ error: "Cannot demote owner without transfer" }, { status: 400 });
  }

  const updated = await prisma.enterpriseWorkspaceMember.update({
    where: { id: member.id },
    data: { role: roleRaw as LecipmWorkspaceRole },
    select: { id: true, role: true, userId: true },
  });

  await appendWorkspaceAuditLog(prisma, {
    workspaceId,
    actorUserId: userId!,
    action: "member_role_changed",
    entityType: "member",
    entityId: updated.userId,
    metadata: { previousRole: member.role, newRole: updated.role },
  });

  return NextResponse.json({ ok: true, userId: updated.userId, role: updated.role });
}
