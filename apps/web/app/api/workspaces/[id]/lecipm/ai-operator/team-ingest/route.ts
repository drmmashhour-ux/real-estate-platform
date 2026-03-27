import { NextResponse } from "next/server";
import { LecipmWorkspaceRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { requireWorkspacePermission } from "@/modules/enterprise/infrastructure/requireWorkspacePermission";
import { workspaceDealWhere } from "@/modules/enterprise/domain/workspaceDataScope";
import { generateActions } from "@/src/modules/ai-operator/application/generateActions";
import { persistGeneratedActions } from "@/src/modules/ai-operator/infrastructure/aiOperatorRepository";

type Ctx = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

/**
 * POST /api/workspaces/[id]/lecipm/ai-operator/team-ingest
 * Builds a team snapshot from scoped deals and persists AI operator actions with workspace_id.
 */
export async function POST(_req: Request, ctx: Ctx) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: workspaceId } = await ctx.params;
  const auth = await requireWorkspacePermission(prisma, {
    userId,
    workspaceId,
    permission: "access_copilot",
  });
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const dealWhere = workspaceDealWhere(workspaceId, auth.role, auth.userId);
  const deals = await prisma.deal.findMany({
    where: dealWhere,
    select: { id: true, status: true, brokerId: true, updatedAt: true, possibleBypassFlag: true, _count: { select: { documents: true } } },
    take: 300,
  });

  const now = Date.now();
  const staleMs = 14 * 24 * 60 * 60 * 1000;
  const active = deals.filter((d) => d.status !== "closed" && d.status !== "cancelled");
  const staleDeals = active.filter((d) => now - d.updatedAt.getTime() > staleMs);
  let riskAlertCount = 0;
  for (const d of deals) {
    if (d.possibleBypassFlag) riskAlertCount += 1;
    if (d._count.documents === 0 && d.status !== "cancelled" && d.status !== "closed") riskAlertCount += 1;
  }

  const snapshot: Record<string, unknown> = {
    workspaceId,
    activeDealCount: active.length,
    staleDealCount: staleDeals.length,
    riskAlertCount,
  };

  if (auth.role === LecipmWorkspaceRole.broker) {
    snapshot.brokerUserId = auth.userId;
  } else {
    const brokers = [...new Set(deals.map((d) => d.brokerId).filter(Boolean))] as string[];
    if (brokers.length === 1) snapshot.brokerUserId = brokers[0];
  }

  const proposals = generateActions("team_workspace", snapshot);
  if (proposals.length === 0) {
    return NextResponse.json({ ok: true, createdIds: [], mode: "manual", proposals: 0, snapshot });
  }

  const { createdIds, mode } = await persistGeneratedActions(userId, proposals, { workspaceId });
  return NextResponse.json({ ok: true, createdIds, mode, proposals: proposals.length, snapshot });
}
