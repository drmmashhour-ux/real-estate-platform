import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createTunedSameSetValidationRun } from "@/modules/model-validation/application/createTunedValidationRun";
import { requirePlatformAdmin } from "../../../_auth";

export const dynamic = "force-dynamic";

/**
 * Round 2A — rerun the same listings as baseline `[id]` with a tuned scoring profile (admin only).
 * Does not change production thresholds.
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const gate = await requirePlatformAdmin();
  if (!gate.ok) return NextResponse.json({ error: "Forbidden" }, { status: gate.status });

  const { id: baselineRunId } = await context.params;
  let body: { tuningProfileId?: string; name?: string | null; compareToBaseline?: boolean };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.tuningProfileId?.trim()) {
    return NextResponse.json({ error: "tuningProfileId is required" }, { status: 400 });
  }

  try {
    const { run, comparison } = await createTunedSameSetValidationRun(prisma, {
      baselineRunId,
      tuningProfileId: body.tuningProfileId.trim(),
      name: body.name ?? null,
      createdBy: gate.userId,
      compareToBaseline: body.compareToBaseline !== false,
    });

    return NextResponse.json({
      runId: run.id,
      itemCount: run.items.length,
      validationRunKind: run.validationRunKind,
      appliedTuningProfileId: run.appliedTuningProfileId,
      comparisonTargetRunId: run.comparisonTargetRunId,
      comparison,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
