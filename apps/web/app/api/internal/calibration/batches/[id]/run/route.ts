import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { runCalibrationBatch } from "@/modules/continuous-calibration/application/runCalibrationBatch";
import { requirePlatformAdmin } from "../../../../model-validation/_auth";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const gate = await requirePlatformAdmin();
  if (!gate.ok) return NextResponse.json({ error: "Forbidden" }, { status: gate.status });

  const { id } = await context.params;
  try {
    const result = await runCalibrationBatch(prisma, id);
    return NextResponse.json({
      batchId: result.batchId,
      metrics: result.metrics,
      segments: result.segments,
      driftSummary: result.driftSummary,
      tuningReview: result.tuningReview,
      alertCount: result.alerts.length,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
