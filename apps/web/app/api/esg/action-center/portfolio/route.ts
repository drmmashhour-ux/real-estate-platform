import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import {
  getLatestPortfolioSummaryJson,
  getListingIdsForPortfolioUser,
} from "@/modules/esg/esg-action-portfolio.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const listingIds = await getListingIdsForPortfolioUser(userId, user.role);
    const actions = await prisma.esgAction.findMany({
      where: {
        listingId: { in: listingIds },
        status: { in: ["OPEN", "IN_PROGRESS", "BLOCKED"] },
      },
      include: {
        listing: { select: { id: true, title: true, listingCode: true } },
      },
    });

    const topPriorityAssetsMap = new Map<
      string,
      { listingId: string; title: string; code: string; critical: number; total: number }
    >();

    for (const a of actions) {
      const cur = topPriorityAssetsMap.get(a.listingId) ?? {
        listingId: a.listingId,
        title: a.listing.title,
        code: a.listing.listingCode,
        critical: 0,
        total: 0,
      };
      cur.total += 1;
      if (a.priority === "CRITICAL") cur.critical += 1;
      topPriorityAssetsMap.set(a.listingId, cur);
    }

    const topPriorityAssets = [...topPriorityAssetsMap.values()]
      .sort((x, y) => y.critical - x.critical || y.total - x.total)
      .slice(0, 15);

    const quickWins = actions.filter((a) => a.actionType === "QUICK_WIN").slice(0, 40);
    const capexCandidates = actions.filter((a) => a.actionType === "CAPEX").slice(0, 30);
    const blockers = actions.filter((a) => a.priority === "CRITICAL").slice(0, 40);

    const summaryRow = await getLatestPortfolioSummaryJson(userId);

    return NextResponse.json({
      summary: summaryRow ?
        {
          totalAssets: summaryRow.totalAssets,
          totalOpenActions: summaryRow.totalOpenActions,
          criticalActions: summaryRow.criticalActions,
          quickWins: summaryRow.quickWins,
          capexActions: summaryRow.capexActions,
          averagePotentialScoreUplift: summaryRow.averagePotentialScoreUplift,
          createdAt: summaryRow.createdAt.toISOString(),
        }
      : null,
      topPriorityAssets,
      bestQuickWins: quickWins.map((a) => ({
        id: a.id,
        listingId: a.listingId,
        listingTitle: a.listing.title,
        listingCode: a.listing.listingCode,
        title: a.title,
        priority: a.priority,
      })),
      capexCandidates: capexCandidates.map((a) => ({
        id: a.id,
        listingId: a.listingId,
        listingTitle: a.listing.title,
        title: a.title,
        costBand: a.estimatedCostBand,
      })),
      blockers: blockers.map((a) => ({
        id: a.id,
        listingId: a.listingId,
        listingTitle: a.listing.title,
        title: a.title,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Unable to load portfolio actions" }, { status: 500 });
  }
}
