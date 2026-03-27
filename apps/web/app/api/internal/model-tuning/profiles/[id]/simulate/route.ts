import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { recordComparison } from "@/modules/model-tuning/infrastructure/tuningRepository";
import { simulateTuningOnValidationRun } from "@/modules/model-tuning/infrastructure/thresholdSimulationService";
import type { TuningProfileConfig } from "@/modules/scoring/tuningProfile";
import { requirePlatformAdmin } from "../../../_auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const gate = await requirePlatformAdmin();
  if (!gate.ok) return NextResponse.json({ error: "Forbidden" }, { status: gate.status });

  const { id: profileId } = await context.params;

  let body: { validationRunId?: string };
  try {
    body = (await request.json()) as { validationRunId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.validationRunId?.trim()) {
    return NextResponse.json({ error: "validationRunId required" }, { status: 400 });
  }

  const profile = await prisma.tuningProfile.findUnique({ where: { id: profileId } });
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const config = profile.config as TuningProfileConfig;

  try {
    const result = await simulateTuningOnValidationRun(prisma, body.validationRunId, profileId, config);

    await recordComparison(prisma, {
      tuningProfileId: profileId,
      validationRunId: body.validationRunId,
      beforeMetrics: result.beforeMetrics,
      afterMetrics: result.afterMetrics,
    });

    return NextResponse.json({
      ...result,
      beforeMetrics: result.beforeMetrics,
      afterMetrics: result.afterMetrics,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Simulation failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
