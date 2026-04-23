import { NextRequest, NextResponse } from "next/server";
import { GrowthEngineLeadStage } from "@prisma/client";
import { z } from "zod";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { prisma } from "@repo/db";
import { updateLeadStage } from "@/lib/growth/lead-service";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  stage: z.enum(["new", "contacted", "interested", "awaiting_assets", "converted", "lost"]).optional(),
  notes: z.string().max(8000).nullable().optional(),
  markSent: z.boolean().optional(),
  lastTemplateKey: z.string().max(64).nullable().optional(),
  needsFollowUp: z.boolean().optional(),
  archived: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await ctx.params;
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const d = parsed.data;
  const existing = await prisma.growthEngineLead.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (d.markSent) {
    await updateLeadStage(id, {
      lastContactAt: new Date(),
      lastTemplateKey: d.lastTemplateKey ?? existing.lastTemplateKey,
      needsFollowUp: d.needsFollowUp ?? false,
      followUpReason: null,
      ...(d.notes !== undefined ? { notes: d.notes } : {}),
      ...(d.stage ? { stage: d.stage as GrowthEngineLeadStage } : {}),
    });
    return NextResponse.json({ ok: true });
  }

  if (d.archived === true) {
    await updateLeadStage(id, {
      archivedAt: new Date(),
      needsFollowUp: false,
    });
    return NextResponse.json({ ok: true });
  }

  if (d.archived === false) {
    await updateLeadStage(id, {
      archivedAt: null,
    });
    return NextResponse.json({ ok: true });
  }

  await updateLeadStage(id, {
    ...(d.stage ? { stage: d.stage as GrowthEngineLeadStage } : {}),
    ...(d.notes !== undefined ? { notes: d.notes } : {}),
    ...(d.lastTemplateKey !== undefined ? { lastTemplateKey: d.lastTemplateKey } : {}),
    ...(d.needsFollowUp !== undefined ? { needsFollowUp: d.needsFollowUp } : {}),
  });

  return NextResponse.json({ ok: true });
}
