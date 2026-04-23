import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { requireWorkspacePermission } from "@/modules/enterprise/infrastructure/requireWorkspacePermission";
import { generateDealInsights } from "@/modules/lecipm-monopoly/application/generateDealInsights";
import { buildWorkspaceAggregatedStats } from "@/modules/lecipm-monopoly/infrastructure/buildWorkspaceAggregatedStats";

type Ctx = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

/** GET — aggregated insights for this workspace only. */
export async function GET(_request: NextRequest, ctx: Ctx) {
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

  const aggregates = await buildWorkspaceAggregatedStats(prisma, workspaceId);
  const insights = generateDealInsights(aggregates);

  const [referralsCount, sharesCount] = await Promise.all([
    prisma.workspaceReferral.count({ where: { workspaceId } }),
    prisma.workspaceDealShare.count({ where: { workspaceId } }),
  ]);

  return NextResponse.json({
    insights,
    aggregates: {
      historyRows: aggregates.historyRows,
      won: aggregates.won,
      lost: aggregates.lost,
      canceled: aggregates.canceled,
      avgDaysToOutcome: aggregates.avgDaysToOutcome,
      activeBrokersInHistory: aggregates.activeBrokersInHistory,
    },
    networkEffects: {
      referralsRecorded: referralsCount,
      dealSharesCount: sharesCount,
    },
  });
}
