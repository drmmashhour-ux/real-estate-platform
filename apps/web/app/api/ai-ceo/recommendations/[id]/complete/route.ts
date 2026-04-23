import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { applyAiCeoRecommendationDecision } from "@/modules/ai-ceo/ai-ceo-decision.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await ctx.params;
  const body = await request.json().catch(() => ({}));
  const notes = typeof body.outcomeNotes === "string" ? body.outcomeNotes : undefined;
  const outcomeImpactBand = typeof body.outcomeImpactBand === "string" ? body.outcomeImpactBand : undefined;

  try {
    await applyAiCeoRecommendationDecision({
      recommendationId: id,
      actorUserId: auth.userId,
      decision: "completed",
      outcomeNotes: notes,
      outcomeImpactBand,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[ai-ceo/complete]", e);
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }
}
