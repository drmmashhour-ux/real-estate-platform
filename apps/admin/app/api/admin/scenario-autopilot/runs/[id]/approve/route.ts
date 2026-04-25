import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { approveRun } from "@/modules/scenario-autopilot/scenario-approval.service";

import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await ctx.params;
  let body: { comment?: string } = {};
  try {
    body = (await request.json()) as { comment?: string };
  } catch {
    body = {};
  }
  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { role: true },
  });
  if (!user) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }
  const r = await approveRun(id, auth.userId, user.role, body.comment);
  if (!r.ok) {
    return NextResponse.json({ error: r.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
