import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createTunedFreshSetValidationRun } from "@/modules/model-validation/application/createTunedValidationRun";
import { requirePlatformAdmin } from "../../_auth";

export const dynamic = "force-dynamic";

/**
 * Round 2B — sample a fresh 50-listing set and score with the tuned profile (admin only).
 */
export async function POST(request: Request) {
  const gate = await requirePlatformAdmin();
  if (!gate.ok) return NextResponse.json({ error: "Forbidden" }, { status: gate.status });

  let body: {
    tuningProfileId?: string;
    baselineRunId?: string;
    name?: string | null;
    compareToBaseline?: boolean;
    compareToSameSetRunId?: string | null;
    excludeEntityIds?: string[];
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.tuningProfileId?.trim() || !body.baselineRunId?.trim()) {
    return NextResponse.json({ error: "tuningProfileId and baselineRunId are required" }, { status: 400 });
  }

  try {
    const result = await createTunedFreshSetValidationRun(prisma, {
      tuningProfileId: body.tuningProfileId.trim(),
      baselineRunId: body.baselineRunId.trim(),
      name: body.name ?? null,
      createdBy: gate.userId,
      excludeEntityIds: body.excludeEntityIds,
      compareToBaseline: body.compareToBaseline !== false,
      compareToSameSetRunId: body.compareToSameSetRunId ?? null,
    });

    return NextResponse.json({
      runId: result.run.id,
      itemCount: result.run.items.length,
      validationRunKind: result.run.validationRunKind,
      appliedTuningProfileId: result.run.appliedTuningProfileId,
      comparisonTargetRunId: result.run.comparisonTargetRunId,
      sampling: result.sampling,
      comparisonBaseline: result.comparisonBaseline,
      comparisonSame: result.comparisonSame,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
