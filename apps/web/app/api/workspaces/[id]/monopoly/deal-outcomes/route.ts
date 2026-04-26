import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { requireWorkspacePermission } from "@/modules/enterprise/infrastructure/requireWorkspacePermission";
import { recordDealOutcome } from "@/modules/lecipm-monopoly/application/recordDealOutcome";
import { canRecordDealOutcome } from "@/modules/lecipm-monopoly/policies/recordOutcomePolicy";
import { buildWorkspaceAggregatedStats } from "@/modules/lecipm-monopoly/infrastructure/buildWorkspaceAggregatedStats";
import { generateActions } from "@/src/modules/ai-operator/application/generateActions";
import { persistGeneratedActions } from "@/src/modules/ai-operator/infrastructure/aiOperatorRepository";

type Ctx = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

/** POST — append deal_history (workspace-scoped). */
export async function POST(request: NextRequest, ctx: Ctx) {
  const userId = await getGuestId();
  const { id: workspaceId } = await ctx.params;
  const auth = await requireWorkspacePermission(prisma, {
    userId,
    workspaceId,
    permission: "view_internal_analytics",
  });
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await request.json().catch(() => ({}))) as {
    dealId?: string;
    outcome?: string;
    priceCents?: number;
    timeline?: Record<string, unknown>;
  };

  const dealId = typeof body.dealId === "string" ? body.dealId.trim() : "";
  const outcome = body.outcome as "won" | "lost" | "canceled" | undefined;
  const priceCents = typeof body.priceCents === "number" && Number.isFinite(body.priceCents) ? body.priceCents : NaN;

  if (!dealId || !outcome || !["won", "lost", "canceled"].includes(outcome) || !Number.isFinite(priceCents)) {
    return NextResponse.json({ error: "dealId, outcome (won|lost|canceled), priceCents required" }, { status: 400 });
  }

  const deal = await prisma.deal.findFirst({
    where: { id: dealId, workspaceId },
    select: { brokerId: true },
  });
  if (!deal) {
    return NextResponse.json({ error: "Deal not in workspace" }, { status: 404 });
  }

  if (!canRecordDealOutcome({ isPlatformAdmin: auth.isPlatformAdmin, role: auth.role, userId: auth.userId, dealBrokerId: deal.brokerId })) {
    return NextResponse.json({ error: "Insufficient permissions to record outcome" }, { status: 403 });
  }

  const result = await recordDealOutcome(prisma, {
    workspaceId,
    dealId,
    outcome,
    priceCents,
    timeline: body.timeline ?? null,
    actorUserId: auth.userId,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const stats = await buildWorkspaceAggregatedStats(prisma, workspaceId);
  const proposals = generateActions("monopoly_learning", {
    workspaceId,
    outcome,
    historyRows: stats.historyRows,
  });
  if (proposals.length > 0) {
    await persistGeneratedActions(auth.userId, proposals, { workspaceId });
  }

  return NextResponse.json({ historyId: result.historyId });
}
