import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { requireWorkspacePermission } from "@/modules/enterprise/infrastructure/requireWorkspacePermission";

type Ctx = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

/** GET /api/workspaces/[id] — workspace overview (sanitized). */
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

  const ws = await prisma.enterpriseWorkspace.findUnique({
    where: { id: workspaceId },
    select: {
      id: true,
      name: true,
      slug: true,
      planTier: true,
      seatLimit: true,
      createdAt: true,
      _count: { select: { members: true, invites: true } },
    },
  });
  if (!ws) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const sub = await prisma.subscription.findFirst({
    where: { workspaceId },
    select: {
      planCode: true,
      status: true,
      currentPeriodEnd: true,
    },
  });

  return NextResponse.json({
    workspace: {
      id: ws.id,
      name: ws.name,
      slug: ws.slug,
      planTier: ws.planTier,
      seatLimit: ws.seatLimit,
      memberCount: ws._count.members,
      pendingInvites: ws._count.invites,
      createdAt: ws.createdAt,
    },
    billing: sub
      ? {
          planCode: sub.planCode,
          status: sub.status,
          currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
        }
      : null,
  });
}

/** PATCH /api/workspaces/[id] — name / enterprise settings (owner & admin). */
export async function PATCH(request: NextRequest, ctx: Ctx) {
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

  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    settings?: Record<string, unknown>;
  };

  const data: { name?: string; settings?: object } = {};
  if (typeof body.name === "string" && body.name.trim()) {
    data.name = body.name.trim().slice(0, 200);
  }
  if (body.settings && typeof body.settings === "object" && !Array.isArray(body.settings)) {
    const cur = await prisma.enterpriseWorkspace.findUnique({
      where: { id: workspaceId },
      select: { settings: true },
    });
    const prev = (cur?.settings && typeof cur.settings === "object" ? cur.settings : {}) as Record<string, unknown>;
    data.settings = { ...prev, ...body.settings } as object;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const ws = await prisma.enterpriseWorkspace.update({
    where: { id: workspaceId },
    data,
    select: { id: true, name: true, settings: true },
  });

  return NextResponse.json({ workspace: ws });
}
