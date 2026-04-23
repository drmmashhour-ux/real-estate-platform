import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { requireWorkspacePermission } from "@/modules/enterprise/infrastructure/requireWorkspacePermission";

type Ctx = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

/** GET /api/workspaces/[id]/usage — aggregated usage (no sensitive internals). */
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

  const [copilotRuns, auditByAction, trustgraphRuns, dealRuns] = await Promise.all([
    prisma.copilotRun.count({ where: { workspaceId } }),
    prisma.workspaceAuditLog.groupBy({
      by: ["action"],
      where: { workspaceId },
      _count: { action: true },
    }),
    prisma.workspaceAuditLog.count({
      where: { workspaceId, action: "trustgraph_run" },
    }),
    prisma.workspaceAuditLog.count({
      where: { workspaceId, action: "deal_analysis_run" },
    }),
  ]);

  const activeMembers = await prisma.enterpriseWorkspaceMember.count({ where: { workspaceId } });

  return NextResponse.json({
    workspaceId,
    activeMembers,
    copilotRuns,
    trustgraphRunsFromAudit: trustgraphRuns,
    dealAnalysesFromAudit: dealRuns,
    auditActionCounts: auditByAction.map((a) => ({ action: a.action, count: a._count.action })),
  });
}
