import { prisma } from "@/lib/db";
import { loadCompanyAiCeoBridgeContext } from "@/modules/company-ai/company-ceo-bridge.service";

export class CeoWeeklyPlanEngine {
  static async generateWeeklyPlan(snapshotId: string) {
    const snapshot = await prisma.ceoSnapshot.findUnique({
      where: { id: snapshotId }
    });

    if (!snapshot) throw new Error("Snapshot not found");

    const recommendations = (snapshot.recommendationsJson as any[]) || [];
    const risks = (snapshot.riskJson as any).insights || [];
    const opportunities = (snapshot.opportunitiesJson as any).insights || [];

    // Prioritize top 5 actions for the week
    const priorities = [
      ...recommendations.map(r => ({ type: "ACTION", title: `${r.type}: ${r.targetType}`, priority: r.priorityScore })),
      ...risks.map(r => ({ type: "RISK_MITIGATION", title: `RESOLVE: ${r.title}`, priority: r.impactScore })),
      ...opportunities.map(o => ({ type: "OPPORTUNITY", title: `ACTIVATE: ${o.title}`, priority: o.impactScore }))
    ].sort((a, b) => b.priority - a.priority).slice(0, 5);

    // Specific focus areas
    const companyAi = await loadCompanyAiCeoBridgeContext();

    const weeklyFocus = {
      topPriorities: priorities,
      dealsToClose: await this.getHighProbabilityDeals(),
      investorsToActivate: await this.getTopStagnantInvestors(),
      risksToResolve: risks.slice(0, 3).map((r: any) => r.title),
      aiTasks: [
        "Re-evaluate lead scoring",
        "Optimize dynamic pricing bounds",
        ...companyAi.doubleDown.slice(0, 2).map((d) => `[Company AI] ${d}`),
      ],
      companyAi: {
        patterns: companyAi.patterns,
        deprioritizeSegments: companyAi.deprioritizeSegments,
        doubleDown: companyAi.doubleDown,
        proposedAdaptationsCount: companyAi.proposedAdaptations.length,
        rolledOutCount: companyAi.rolledOutAdaptations.length,
      },
    };

    return weeklyFocus;
  }

  private static async getHighProbabilityDeals() {
    return await prisma.deal.findMany({
      where: { status: { notIn: ["closed", "cancelled"] } },
      orderBy: { priceCents: "desc" },
      take: 3,
      select: { id: true, dealCode: true, priceCents: true }
    });
  }

  private static async getTopStagnantInvestors() {
    return await prisma.amfInvestor.findMany({
      take: 3,
      select: { id: true, legalName: true }
    });
  }
}
