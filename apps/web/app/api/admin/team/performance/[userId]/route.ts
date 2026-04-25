import { NextRequest, NextResponse } from "next/server";
import { assertFieldTeamApi } from "@/lib/admin/field-team-admin";
import { requireSessionUserIdOr401 } from "@/lib/auth/api-session";
import { prisma } from "@/lib/db";

function num(v: unknown): number | undefined {
  if (v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined;
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ userId: string }> }) {
  const sid = await requireSessionUserIdOr401(req);
  if (sid instanceof NextResponse) return sid;
  const actor = await prisma.user.findUnique({
    where: { id: sid.userId },
    select: { id: true, email: true, role: true },
  });
  if (!assertFieldTeamApi(actor)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await ctx.params;
  try {
    const body = await req.json();
    const demosCompleted = num(body.demosCompleted);
    const brokersActivated = num(body.brokersActivated);
    const callsMade = num(body.callsMade);

    const data: { demosCompleted?: number; brokersActivated?: number; callsMade?: number } = {};
    if (demosCompleted !== undefined) data.demosCompleted = demosCompleted;
    if (brokersActivated !== undefined) data.brokersActivated = brokersActivated;
    if (callsMade !== undefined) data.callsMade = callsMade;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "no valid fields" }, { status: 400 });
    }

    const updated = await prisma.fieldSpecialistPerformance.update({
      where: { userId },
      data,
      include: { user: { select: { id: true, email: true, name: true } } },
    });
    return NextResponse.json(updated);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
