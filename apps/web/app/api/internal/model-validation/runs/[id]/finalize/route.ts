import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { finalizeValidationRun } from "@/modules/model-validation/application/finalizeValidationRun";
import { requirePlatformAdmin } from "../../../_auth";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const gate = await requirePlatformAdmin();
  if (!gate.ok) return NextResponse.json({ error: "Forbidden" }, { status: gate.status });

  const { id } = await context.params;

  try {
    const run = await finalizeValidationRun(prisma, id);
    return NextResponse.json({
      id: run.id,
      status: run.status,
      completedAt: run.completedAt?.toISOString() ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
