import { NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { createCalibrationBatch } from "@/modules/continuous-calibration/application/createCalibrationBatch";
import { listCalibrationBatches } from "@/modules/continuous-calibration/infrastructure/calibrationRepository";
import { requirePlatformAdmin } from "../../model-validation/_auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await requirePlatformAdmin();
  if (!gate.ok) return NextResponse.json({ error: "Forbidden" }, { status: gate.status });

  const rows = await listCalibrationBatches(prisma, 60);
  return NextResponse.json({
    batches: rows.map((b) => ({
      id: b.id,
      name: b.name,
      status: b.status,
      listingCount: b.listingCount,
      createdAt: b.createdAt.toISOString(),
      completedAt: b.completedAt?.toISOString() ?? null,
      activeTuningProfileId: b.activeTuningProfileId,
      activeTuningProfileName: b.activeTuningProfile?.name ?? null,
      itemCount: b._count.items,
      driftAlertCount: b._count.driftAlerts,
      tuningReviewRecommended: b.tuningReviewRecommended ?? null,
    })),
  });
}

export async function POST(request: Request) {
  const gate = await requirePlatformAdmin();
  if (!gate.ok) return NextResponse.json({ error: "Forbidden" }, { status: gate.status });

  let body: {
    name?: string | null;
    description?: string | null;
    sourceValidationRunIds?: string[];
    targetMinItems?: number;
    targetMaxItems?: number;
    compositionTargets?: Record<string, number> | null;
    activeTuningProfileId?: string | null;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.sourceValidationRunIds?.length) {
    return NextResponse.json({ error: "sourceValidationRunIds is required" }, { status: 400 });
  }

  try {
    const batch = await createCalibrationBatch(prisma, {
      name: body.name,
      description: body.description,
      sourceValidationRunIds: body.sourceValidationRunIds,
      targetMinItems: body.targetMinItems,
      targetMaxItems: body.targetMaxItems,
      compositionTargets: body.compositionTargets ?? undefined,
      activeTuningProfileId: body.activeTuningProfileId ?? null,
      createdBy: gate.userId,
    });
    return NextResponse.json({
      id: batch?.id,
      listingCount: batch?.listingCount,
      status: batch?.status,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
