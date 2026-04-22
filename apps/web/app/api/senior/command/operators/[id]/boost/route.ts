import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logSeniorCommand } from "@/lib/senior-command/log";
import { canOps, seniorCommandAuth } from "@/lib/senior-command/api-auth";

export const dynamic = "force-dynamic";

/** Boost visibility — adjusts rankBoostPoints on operator residences (bounded). */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await seniorCommandAuth();
  if (!auth.ok) return auth.response;
  if (!canOps(auth.ctx)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: operatorId } = await ctx.params;
  let body: { delta?: number };
  try {
    body = (await req.json()) as { delta?: number };
  } catch {
    body = {};
  }
  const delta = typeof body.delta === "number" ? Math.round(body.delta) : 2;

  const resList = await prisma.seniorResidence.findMany({
    where: { operatorId },
    select: { id: true },
    take: 80,
  });

  for (const r of resList) {
    const cur = await prisma.seniorResidence.findUnique({
      where: { id: r.id },
      select: { rankBoostPoints: true },
    });
    const next = Math.max(-5, Math.min(5, (cur?.rankBoostPoints ?? 0) + delta));
    await prisma.seniorResidence.update({
      where: { id: r.id },
      data: { rankBoostPoints: next },
    });
  }

  logSeniorCommand("[senior-optimization]", "operator_boost", {
    operatorId: operatorId.slice(0, 8),
    delta,
  });

  return NextResponse.json({
    ok: true,
    updatedResidences: resList.length,
    message: "Ranking boost applied within platform guardrails [-5, 5].",
  });
}
