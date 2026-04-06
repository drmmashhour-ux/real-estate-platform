import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { prisma } from "@/lib/db";
import { recordOutcome } from "@/lib/growth-brain/learning";
import { GrowthBrainApprovalStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  action: z.enum(["view", "dismiss", "approve_queue", "reject"]),
  notes: z.string().max(2000).optional(),
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
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const rec = await prisma.growthBrainRecommendation.findUnique({ where: { id } });
  if (!rec) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { action, notes } = parsed.data;

  if (action === "view") {
    await prisma.growthBrainRecommendation.update({
      where: { id },
      data: { viewedCount: { increment: 1 } },
    });
    await recordOutcome(prisma, id, "viewed");
    return NextResponse.json({ ok: true });
  }

  if (action === "dismiss") {
    await prisma.growthBrainRecommendation.update({
      where: { id },
      data: { status: "dismissed", dismissedCount: { increment: 1 } },
    });
    await recordOutcome(prisma, id, "dismissed", notes ? { notes } : undefined);
    return NextResponse.json({ ok: true });
  }

  if (action === "approve_queue") {
    await prisma.growthBrainApproval.create({
      data: {
        recommendationId: id,
        status: GrowthBrainApprovalStatus.pending,
        reviewerId: auth.userId,
        notes: notes ?? null,
      },
    });
    await prisma.growthBrainRecommendation.update({
      where: { id },
      data: { approvedCount: { increment: 1 } },
    });
    await recordOutcome(prisma, id, "approved", notes ? { notes } : undefined);
    return NextResponse.json({ ok: true });
  }

  await prisma.growthBrainApproval.create({
    data: {
      recommendationId: id,
      status: GrowthBrainApprovalStatus.rejected,
      reviewerId: auth.userId,
      notes: notes ?? null,
    },
  });
  await recordOutcome(prisma, id, "rejected", notes ? { notes } : undefined);
  return NextResponse.json({ ok: true });
}
