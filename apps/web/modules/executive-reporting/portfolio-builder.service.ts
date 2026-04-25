import { prisma } from "@/lib/db";
import type { PortfolioDealHighlight, PortfolioSection } from "./executive-report.types";

export async function buildPortfolioSection(): Promise<PortfolioSection> {
  const assumptions: string[] = [
    "Risk/opportunity labels come from latest `underwritingLabel` / `underwritingRecommendation` on pipeline deals.",
    "Lists are capped for readability; full detail remains in operational tools.",
  ];

  try {
    const [riskDeals, oppDeals, brokerRows] = await Promise.all([
      prisma.investmentPipelineDeal.findMany({
        where: {
          status: "ACTIVE",
          closedAt: null,
          OR: [
            { underwritingLabel: "WEAK" },
            { underwritingRecommendation: "AVOID" },
            { underwritingRecommendation: "HOLD" },
          ],
        },
        take: 12,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          title: true,
          pipelineStage: true,
          underwritingLabel: true,
          underwritingRecommendation: true,
          ownerUser: { select: { name: true } },
        },
      }),
      prisma.investmentPipelineDeal.findMany({
        where: {
          status: "ACTIVE",
          closedAt: null,
          OR: [
            { underwritingLabel: "STRONG" },
            { underwritingRecommendation: "BUY" },
            { underwritingRecommendation: "BUY_WITH_RETROFIT_PLAN" },
          ],
        },
        take: 12,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          title: true,
          pipelineStage: true,
          underwritingLabel: true,
          underwritingRecommendation: true,
          ownerUser: { select: { name: true } },
        },
      }),
      prisma.investmentPipelineDeal.groupBy({
        by: ["ownerUserId"],
        where: { status: "ACTIVE", closedAt: null, ownerUserId: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 8,
      }),
    ]);

    const mapDeal = (d: (typeof riskDeals)[0]): PortfolioDealHighlight => ({
      dealId: d.id,
      title: d.title,
      pipelineStage: d.pipelineStage,
      underwritingLabel: d.underwritingLabel,
      underwritingRecommendation: d.underwritingRecommendation,
      brokerName: d.ownerUser?.name ?? null,
    });

    const ownerIds = brokerRows.map((r) => r.ownerUserId).filter(Boolean) as string[];
    const owners = await prisma.user.findMany({
      where: { id: { in: ownerIds } },
      select: { id: true, name: true },
    });
    const nameById = new Map(owners.map((u) => [u.id, u.name ?? "Unknown"]));

    const brokerHighlights = brokerRows.map((r) => ({
      brokerName: r.ownerUserId ? (nameById.get(r.ownerUserId) ?? "Unknown") : "Unassigned",
      activeDealCount: r._count.id,
    }));

    return {
      highRiskDeals: riskDeals.map(mapDeal),
      highOpportunityDeals: oppDeals.map(mapDeal),
      brokerHighlights,
      assumptions,
    };
  } catch {
    return {
      highRiskDeals: [],
      highOpportunityDeals: [],
      brokerHighlights: [],
      assumptions: [...assumptions, "Portfolio section could not be loaded."],
    };
  }
}
