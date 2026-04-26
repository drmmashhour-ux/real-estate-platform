import { NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { createValidationRun } from "@/modules/model-validation/application/createValidationRun";
import { listRuns } from "@/modules/model-validation/infrastructure/validationRepository";
import { requirePlatformAdmin } from "../_auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await requirePlatformAdmin();
  if (!gate.ok) return NextResponse.json({ error: "Forbidden" }, { status: gate.status });

  const rows = await listRuns(prisma, 80);
  return NextResponse.json({
    runs: rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      status: r.status,
      validationRunKind: r.validationRunKind,
      appliedTuningProfileId: r.appliedTuningProfileId,
      appliedTuningProfileName: r.appliedTuningProfile?.name ?? null,
      comparisonTargetRunId: r.comparisonTargetRunId,
      createdBy: r.createdBy,
      createdAt: r.createdAt.toISOString(),
      completedAt: r.completedAt?.toISOString() ?? null,
      itemCount: r._count.items,
    })),
  });
}

export async function POST(request: Request) {
  const gate = await requirePlatformAdmin();
  if (!gate.ok) return NextResponse.json({ error: "Forbidden" }, { status: gate.status });

  let body: { name?: string | null; description?: string | null };
  try {
    body = (await request.json()) as { name?: string | null; description?: string | null };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const run = await createValidationRun(prisma, {
    name: body.name,
    description: body.description,
    createdBy: gate.userId,
  });

  return NextResponse.json({
    id: run.id,
    status: run.status,
    createdAt: run.createdAt.toISOString(),
  });
}
