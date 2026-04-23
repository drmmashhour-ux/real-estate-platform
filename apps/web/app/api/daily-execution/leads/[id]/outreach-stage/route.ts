import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { updateLeadOutreachStage } from "@/src/modules/daily-execution/application/dailyMetricsService";
import { isOutreachCoachingStage, type OutreachCoachingStage } from "@/src/modules/daily-execution/domain/outreachStages";

export const dynamic = "force-dynamic";

/** PATCH { stage: string | null } — only for leads you introduced. */
export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: leadId } = await ctx.params;
  if (!leadId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const body = (await request.json().catch(() => ({}))) as { stage?: string | null };
  const raw = body.stage;

  let stage: OutreachCoachingStage | null = null;
  if (raw === null || raw === undefined || raw === "") {
    stage = null;
  } else if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!isOutreachCoachingStage(trimmed)) {
      return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
    }
    stage = trimmed;
  } else {
    return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
  }

  const result = await updateLeadOutreachStage(prisma, userId, leadId, stage);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 404 });

  return NextResponse.json({ ok: true });
}
