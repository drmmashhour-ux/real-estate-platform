import { NextResponse } from "next/server";
import { listAutonomyActions } from "@/modules/senior-living/autonomy/senior-autonomous.service";
import { seniorCommandAuth } from "@/lib/senior-command/api-auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await seniorCommandAuth();
  if (!auth.ok) return auth.response;
  const pendingOnly = new URL(req.url).searchParams.get("pendingOnly") === "1";
  const rows = await listAutonomyActions({ pendingOnly });

  return NextResponse.json({
    actions: rows.map((r) => ({
      id: r.id,
      actionType: r.actionType,
      payload: r.payload,
      riskLevel: r.riskLevel,
      status: r.status,
      reason: r.reason,
      confidence: r.confidence,
      impactConversionPct: r.impactConversionPct,
      impactRevenuePct: r.impactRevenuePct,
      reversalPayload: r.reversalPayload,
      createdAt: r.createdAt.toISOString(),
      executedAt: r.executedAt?.toISOString() ?? null,
      rejectionReason: r.rejectionReason,
      learningOutcomeJson: r.learningOutcomeJson,
    })),
  });
}
