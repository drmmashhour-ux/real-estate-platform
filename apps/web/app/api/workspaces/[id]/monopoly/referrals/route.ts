import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { requireWorkspacePermission } from "@/modules/enterprise/infrastructure/requireWorkspacePermission";

type Ctx = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

/** Referrals are workspace-scoped attribution (network effect); no cross-org exposure. */
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

  const rows = await prisma.workspaceReferral.findMany({
    where: { workspaceId, referrerUserId: auth.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      referredEmail: true,
      status: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    referrals: rows.map((r) => ({
      id: r.id,
      referredEmail: maskEmail(r.referredEmail),
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}

function maskEmail(email: string): string {
  const [a, b] = email.split("@");
  if (!b) return "***";
  const head = a.slice(0, 2);
  return `${head}***@${b}`;
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

  const body = (await request.json().catch(() => ({}))) as { email?: string };
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const row = await prisma.workspaceReferral.create({
    data: {
      workspaceId,
      referrerUserId: auth.userId,
      referredEmail: email,
      status: "pending",
    },
  });

  return NextResponse.json({ id: row.id, createdAt: row.createdAt.toISOString() });
}
