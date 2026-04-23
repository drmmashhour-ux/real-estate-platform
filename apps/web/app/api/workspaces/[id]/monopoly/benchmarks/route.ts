import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { requireWorkspacePermission } from "@/modules/enterprise/infrastructure/requireWorkspacePermission";
import {
  workspaceDealWhere,
  workspaceLeadWhere,
} from "@/modules/enterprise/domain/workspaceDataScope";

type Ctx = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

/** GET — broker benchmarks + reputation (single workspace). */
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

  const dealWhere = workspaceDealWhere(workspaceId, auth.role, auth.userId);
  const leadWhere = workspaceLeadWhere(workspaceId, auth.role, auth.userId);

  const [deals, reps, leadCounts] = await Promise.all([
    prisma.deal.findMany({
      where: dealWhere,
      select: {
        id: true,
        brokerId: true,
        status: true,
        priceCents: true,
        createdAt: true,
        updatedAt: true,
      },
      take: 500,
    }),
    prisma.workspaceBrokerReputation.findMany({
      where: { workspaceId },
      select: {
        brokerUserId: true,
        score: true,
        successRate: true,
        activityScore: true,
        dealsCounted: true,
      },
    }),
    prisma.lead.groupBy({
      by: ["introducedByBrokerId"],
      where: {
        AND: [leadWhere, { introducedByBrokerId: { not: null } }],
      },
      _count: true,
    }),
  ]);

  const brokerIds = [...new Set(deals.map((d) => d.brokerId).filter(Boolean))] as string[];
  const users =
    brokerIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: brokerIds } },
          select: { id: true, name: true, email: true },
        })
      : [];
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  const byBroker: Record<
    string,
    { deals: number; closed: number; leadTouches: number; priceSum: number; priceN: number }
  > = {};

  for (const d of deals) {
    const bid = d.brokerId;
    if (!bid) continue;
    if (!byBroker[bid]) byBroker[bid] = { deals: 0, closed: 0, leadTouches: 0, priceSum: 0, priceN: 0 };
    byBroker[bid].deals += 1;
    if (d.status === "closed") byBroker[bid].closed += 1;
    byBroker[bid].priceSum += d.priceCents;
    byBroker[bid].priceN += 1;
  }

  for (const g of leadCounts) {
    const bid = g.introducedByBrokerId;
    if (!bid) continue;
    if (!byBroker[bid]) byBroker[bid] = { deals: 0, closed: 0, leadTouches: 0, priceSum: 0, priceN: 0 };
    byBroker[bid].leadTouches += g._count;
  }

  const repMap = Object.fromEntries(reps.map((r) => [r.brokerUserId, r]));

  const rows = Object.entries(byBroker).map(([brokerUserId, v]) => {
    const rep = repMap[brokerUserId];
    const u = userMap[brokerUserId];
    return {
      brokerUserId,
      label: u?.name || u?.email || brokerUserId,
      dealsOpenOrActive: v.deals,
      dealsClosed: v.closed,
      avgPriceCents: v.priceN > 0 ? Math.round(v.priceSum / v.priceN) : null,
      leadTouches: v.leadTouches,
      reputation: rep
        ? {
            score: rep.score,
            successRate: rep.successRate,
            activityScore: rep.activityScore,
            dealsCounted: rep.dealsCounted,
          }
        : null,
    };
  });

  return NextResponse.json({
    brokers: rows.sort((a, b) => (b.reputation?.score ?? 0) - (a.reputation?.score ?? 0)),
  });
}
