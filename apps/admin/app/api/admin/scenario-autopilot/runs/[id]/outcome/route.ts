import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { measureOutcomeForRun } from "@/modules/scenario-autopilot/scenario-outcome.service";

import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await ctx.params;
  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { role: true },
  });
  if (!user) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }
  const o = await measureOutcomeForRun(id, auth.userId, user.role);
  if ("error" in o) {
    return NextResponse.json({ error: o.error }, { status: 400 });
  }
  return NextResponse.json({ outcome: o });
}
