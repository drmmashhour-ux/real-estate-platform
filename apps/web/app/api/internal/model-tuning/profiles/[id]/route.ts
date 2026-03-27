import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePlatformAdmin } from "../../_auth";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const gate = await requirePlatformAdmin();
  if (!gate.ok) return NextResponse.json({ error: "Forbidden" }, { status: gate.status });

  const { id } = await context.params;
  const p = await prisma.tuningProfile.findUnique({ where: { id } });
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    profile: {
      id: p.id,
      name: p.name,
      description: p.description,
      basedOnValidationRunId: p.basedOnValidationRunId,
      config: p.config,
      createdBy: p.createdBy,
      createdAt: p.createdAt.toISOString(),
      appliedAt: p.appliedAt?.toISOString() ?? null,
      appliedBy: p.appliedBy,
      isActive: p.isActive,
      supersedesId: p.supersedesId,
    },
  });
}
