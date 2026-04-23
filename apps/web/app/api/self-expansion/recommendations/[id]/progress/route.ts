import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { applySelfExpansionDecision } from "@/modules/self-expansion/self-expansion-decision.service";

export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await ctx.params;
  let reason: string | null = null;
  try {
    const j = (await req.json().catch(() => ({}))) as { reason?: string };
    reason = typeof j.reason === "string" ? j.reason : null;
  } catch {
    reason = null;
  }

  try {
    await applySelfExpansionDecision({
      recommendationId: id,
      actorUserId: auth.userId,
      decision: "IN_PROGRESS",
      reason,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[self-expansion/progress]", e);
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }
}
