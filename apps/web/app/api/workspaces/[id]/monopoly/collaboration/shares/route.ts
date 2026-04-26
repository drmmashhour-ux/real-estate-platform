import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { requireWorkspacePermission } from "@/modules/enterprise/infrastructure/requireWorkspacePermission";
import { roleHasPermission } from "@/modules/enterprise/domain/workspacePermissions";

type Ctx = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

async function assertMember(workspaceId: string, targetUserId: string): Promise<boolean> {
  const m = await prisma.enterpriseWorkspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
    select: { id: true },
  });
  return Boolean(m);
}

/** GET shares visible to current user; POST create share. */
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

  const rows = await prisma.workspaceDealShare.findMany({
    where: {
      workspaceId,
      OR: [{ targetUserId: auth.userId }, { createdById: auth.userId }],
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      deal: { select: { id: true, dealCode: true, status: true } },
      targetUser: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({
    shares: rows.map((s) => ({
      id: s.id,
      dealId: s.dealId,
      note: s.note,
      createdAt: s.createdAt.toISOString(),
      deal: s.deal,
      targetUser: s.targetUser,
      createdBy: s.createdBy,
    })),
  });
}

export async function POST(request: NextRequest, ctx: Ctx) {
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

  const body = (await request.json().catch(() => ({}))) as {
    dealId?: string;
    targetUserId?: string;
    note?: string;
  };

  const dealId = typeof body.dealId === "string" ? body.dealId.trim() : "";
  const targetUserId = typeof body.targetUserId === "string" ? body.targetUserId.trim() : "";
  if (!dealId || !targetUserId) {
    return NextResponse.json({ error: "dealId and targetUserId required" }, { status: 400 });
  }

  const deal = await prisma.deal.findFirst({
    where: { id: dealId, workspaceId },
    select: { brokerId: true },
  });
  if (!deal) {
    return NextResponse.json({ error: "Deal not in workspace" }, { status: 404 });
  }

  const canShare =
    auth.isPlatformAdmin ||
    roleHasPermission(auth.role, "manage_listings") ||
    (deal.brokerId != null && deal.brokerId === auth.userId);

  if (!canShare) {
    return NextResponse.json({ error: "Cannot share this deal" }, { status: 403 });
  }

  if (!(await assertMember(workspaceId, targetUserId))) {
    return NextResponse.json({ error: "Target is not a workspace member" }, { status: 400 });
  }

  const note = typeof body.note === "string" ? body.note.trim().slice(0, 2000) : null;

  const row = await prisma.workspaceDealShare.create({
    data: {
      workspaceId,
      dealId,
      targetUserId,
      createdById: auth.userId,
      note: note || undefined,
    },
  });

  return NextResponse.json({ id: row.id, createdAt: row.createdAt.toISOString() });
}
