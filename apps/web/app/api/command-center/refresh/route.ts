import { NextResponse } from "next/server";
import { persistCommandCenterSnapshot } from "@/modules/command-center/command-center-ai.service";
import { requireCommandCenterActor } from "@/modules/command-center/command-center-api-guard";

export const dynamic = "force-dynamic";

export async function POST() {
  const actor = await requireCommandCenterActor();
  if (!actor.ok) return actor.response;

  const payload = await persistCommandCenterSnapshot(actor.userId, actor.role);
  return NextResponse.json({
    success: true,
    snapshot: payload.snapshot,
    counts: {
      alerts: payload.alerts.length,
      recommendations: payload.recommendations.length,
    },
  });
}
