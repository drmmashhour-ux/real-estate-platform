import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { requireWorkspacePermission } from "@/modules/enterprise/infrastructure/requireWorkspacePermission";

type Ctx = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

const MAX_BODY = 8000;

/** GET / POST internal collaboration messages (workspace-scoped). */
export async function GET(request: NextRequest, ctx: Ctx) {
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

  const dealId = request.nextUrl.searchParams.get("dealId")?.trim() || undefined;

  const rows = await prisma.workspaceCollaborationMessage.findMany({
    where: {
      workspaceId,
      ...(dealId ? { dealId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 80,
    select: {
      id: true,
      dealId: true,
      body: true,
      createdAt: true,
      author: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({
    messages: rows.map((m) => ({
      id: m.id,
      dealId: m.dealId,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
      author: m.author,
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

  const body = (await request.json().catch(() => ({}))) as { dealId?: string | null; text?: string };
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text || text.length > MAX_BODY) {
    return NextResponse.json({ error: "text required (max 8000 chars)" }, { status: 400 });
  }

  const dealId = typeof body.dealId === "string" && body.dealId.trim() ? body.dealId.trim() : null;
  if (dealId) {
    const deal = await prisma.deal.findFirst({
      where: { id: dealId, workspaceId },
      select: { id: true },
    });
    if (!deal) {
      return NextResponse.json({ error: "Deal not in workspace" }, { status: 404 });
    }
  }

  const row = await prisma.workspaceCollaborationMessage.create({
    data: {
      workspaceId,
      dealId,
      authorId: auth.userId,
      body: text,
    },
  });

  return NextResponse.json({ id: row.id, createdAt: row.createdAt.toISOString() });
}
