import { NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { markTuningProfileApplied } from "@/modules/model-tuning/application/applyTuningProfile";
import { requirePlatformAdmin } from "../../../_auth";

export const dynamic = "force-dynamic";

/** Explicit apply — audit trail only. Runtime use of profiles is opt-in via env / future loader. */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const gate = await requirePlatformAdmin();
  if (!gate.ok) return NextResponse.json({ error: "Forbidden" }, { status: gate.status });

  const { id: profileId } = await context.params;

  let body: { supersedesId?: string | null };
  try {
    body = (await request.json()) as { supersedesId?: string | null };
  } catch {
    body = {};
  }

  const exists = await prisma.tuningProfile.findUnique({ where: { id: profileId } });
  if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await markTuningProfileApplied(prisma, profileId, gate.userId, {
    supersedesId: body.supersedesId ?? null,
  });

  return NextResponse.json({
    id: updated.id,
    appliedAt: updated.appliedAt?.toISOString() ?? null,
    appliedBy: updated.appliedBy,
    isActive: updated.isActive,
  });
}
