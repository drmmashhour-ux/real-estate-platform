import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { applyAiCeoRecommendationDecision } from "@/modules/ai-ceo/ai-ceo-decision.service";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await ctx.params;
  try {
    await applyAiCeoRecommendationDecision({
      recommendationId: id,
      actorUserId: auth.userId,
      decision: "approved",
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[ai-ceo/approve]", e);
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }
}
