import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { requireWorkspacePermission } from "@/modules/enterprise/infrastructure/requireWorkspacePermission";

type Ctx = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

/** GET /api/workspaces/[id]/audit-logs */
export async function GET(request: NextRequest, ctx: Ctx) {
  const userId = await getGuestId();
  const { id: workspaceId } = await ctx.params;
  const auth = await requireWorkspacePermission(prisma, {
    userId,
    workspaceId,
    permission: "manage_workspace",
  });
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const take = Math.min(100, Math.max(1, Number(request.nextUrl.searchParams.get("take")) || 50));

  const rows = await prisma.workspaceAuditLog.findMany({
    where: { workspaceId },
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      metadata: true,
      createdAt: true,
      actor: { select: { id: true, email: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take,
  });

  return NextResponse.json({
    logs: rows.map((r) => ({
      id: r.id,
      action: r.action,
      entityType: r.entityType,
      entityId: r.entityId,
      metadata: r.metadata,
      createdAt: r.createdAt.toISOString(),
      actor: { id: r.actor.id, email: r.actor.email, name: r.actor.name },
    })),
  });
}
