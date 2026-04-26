import { NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { createTuningProfile } from "@/modules/model-tuning/infrastructure/tuningRepository";
import type { TuningProfileConfig } from "@/modules/scoring/tuningProfile";
import { requirePlatformAdmin } from "../_auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await requirePlatformAdmin();
  if (!gate.ok) return NextResponse.json({ error: "Forbidden" }, { status: gate.status });

  const rows = await prisma.tuningProfile.findMany({
    orderBy: { createdAt: "desc" },
    take: 80,
  });

  return NextResponse.json({
    profiles: rows.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      basedOnValidationRunId: p.basedOnValidationRunId,
      createdBy: p.createdBy,
      createdAt: p.createdAt.toISOString(),
      appliedAt: p.appliedAt?.toISOString() ?? null,
      appliedBy: p.appliedBy,
      isActive: p.isActive,
      supersedesId: p.supersedesId,
    })),
  });
}

export async function POST(request: Request) {
  const gate = await requirePlatformAdmin();
  if (!gate.ok) return NextResponse.json({ error: "Forbidden" }, { status: gate.status });

  let body: {
    name?: string | null;
    description?: string | null;
    basedOnValidationRunId?: string | null;
    config?: TuningProfileConfig;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.config || typeof body.config !== "object") {
    return NextResponse.json({ error: "config object required" }, { status: 400 });
  }

  const p = await createTuningProfile(prisma, {
    name: body.name,
    description: body.description,
    basedOnValidationRunId: body.basedOnValidationRunId,
    config: body.config,
    createdBy: gate.userId,
  });

  return NextResponse.json({ id: p.id, createdAt: p.createdAt.toISOString() });
}
