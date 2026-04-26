import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { requireWorkspacePermission } from "@/modules/enterprise/infrastructure/requireWorkspacePermission";

type Ctx = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

/** GET /api/workspaces/[id]/members */
export async function GET(_request: NextRequest, ctx: Ctx) {
  const userId = await getGuestId();
  const { id: workspaceId } = await ctx.params;
  const auth = await requireWorkspacePermission(prisma, {
    userId,
    workspaceId,
    permission: "view_internal_analytics",
  });
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const members = await prisma.enterpriseWorkspaceMember.findMany({
    where: { workspaceId },
    select: {
      id: true,
      role: true,
      createdAt: true,
      user: { select: { id: true, email: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    members: members.map((m) => ({
      membershipId: m.id,
      role: m.role,
      joinedAt: m.createdAt.toISOString(),
      user: { id: m.user.id, email: m.user.email, name: m.user.name },
    })),
  });
}
