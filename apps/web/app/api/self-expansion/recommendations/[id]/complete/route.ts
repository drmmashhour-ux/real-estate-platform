import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { applySelfExpansionDecision } from "@/modules/self-expansion/self-expansion-decision.service";

export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await ctx.params;
  let outcomeNotes: string | null = null;
  let outcomeImpactBand: string | null = null;
  let outcomeMetricsJson: Record<string, unknown> | null = null;
  try {
    const j = (await req.json().catch(() => ({}))) as {
      outcomeNotes?: string;
      outcomeImpactBand?: string;
      outcomeMetricsJson?: Record<string, unknown>;
    };
    outcomeNotes = typeof j.outcomeNotes === "string" ? j.outcomeNotes : null;
    outcomeImpactBand = typeof j.outcomeImpactBand === "string" ? j.outcomeImpactBand : null;
    outcomeMetricsJson =
      j.outcomeMetricsJson && typeof j.outcomeMetricsJson === "object" ? j.outcomeMetricsJson : null;
  } catch {
    outcomeNotes = null;
    outcomeImpactBand = null;
    outcomeMetricsJson = null;
  }

  try {
    await applySelfExpansionDecision({
      recommendationId: id,
      actorUserId: auth.userId,
      decision: "COMPLETED",
      outcomeNotes,
      outcomeImpactBand,
      outcomeMetricsJson,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[self-expansion/complete]", e);
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }
}
