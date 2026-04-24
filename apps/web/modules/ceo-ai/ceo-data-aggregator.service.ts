import { prisma } from "@/lib/db";
import { CeoContext } from "./ceo.types";
import { 
  computeDemandQualitySignals, 
  normalizeDemandIndexMetrics 
} from "@/modules/monetization/dynamic-market-pricing.service";

/**
 * PHASE 2: GLOBAL DATA AGGREGATOR
 * Observes all systems and builds a strategic context for the CEO.
 */
export async function buildCeoContext(): Promise<CeoContext> {
  const d30 = new Date();
  d30.setDate(d30.getDate() - 30);
  const d60 = new Date();
  d60.setDate(d60.getDate() - 60);

  const [
    leads30,
    leads60,
    closed30,
    seoPages,
    dealsActive,
    dealsClosed,
    esgAvg,
    esgActivity,
    activeRollouts,
    rolloutSuccess,
    agentDecisions,
    agentSuccess,
    revenueRows
  ] = await Promise.all([
    // Growth
    prisma.seniorLead.count({ where: { createdAt: { gte: d30 } } }),
    prisma.seniorLead.count({ where: { createdAt: { gte: d60, lt: d30 } } }),
    prisma.seniorLead.count({ where: { createdAt: { gte: d30 }, status: "CLOSED" } }),
    prisma.seoBlogPost.count().catch(() => 0),

    // Deals
    prisma.amfCapitalDeal.count({ where: { status: { notIn: ["CLOSED", "PAUSED", "AVOID"] } } }),
    prisma.amfCapitalDeal.count({ where: { status: "CLOSED", updatedAt: { gte: d30 } } }),

    // ESG
    prisma.esgProfile.aggregate({ _avg: { compositeScore: true } }),
    prisma.esgEvent.count({ where: { createdAt: { gte: d30 } } }),

    // Rollout
    prisma.ceoDecision.count({ where: { status: "EXECUTED", executedAt: { gte: d30 } } }),
    prisma.evolutionOutcomeEvent.count({ where: { createdAt: { gte: d30 } } }),

    // Agents
    prisma.autonomyDecision.count({ where: { createdAt: { gte: d30 } } }),
    prisma.evolutionOutcomeEvent.count({ where: { createdAt: { gte: d30 } } }),

    // Revenue
    prisma.revenueSnapshot.findMany({
      orderBy: { snapshotDate: "desc" },
      take: 2,
      select: { mrr: true }
    })
  ]);

  // Stage distribution for deals
  const stages = await prisma.amfCapitalDeal.groupBy({
    by: ['status'],
    _count: { id: true },
    where: { status: { notIn: ["CLOSED", "PAUSED", "AVOID"] } }
  });
  const stageDistribution: Record<string, number> = {};
  stages.forEach(s => {
    stageDistribution[s.status] = s._count.id;
  });

  const conversionRate = leads30 === 0 ? 0 : closed30 / leads30;
  
  let mrrGrowth = 0;
  if (revenueRows.length >= 2) {
    const latest = Number(revenueRows[0].mrr);
    const prev = Number(revenueRows[1].mrr);
    if (prev > 0) mrrGrowth = (latest - prev) / prev;
  }

  return {
    growth: {
      leads: leads30,
      leadsPrev: leads60,
      conversionRate,
      traffic: seoPages, // Using SEO pages as proxy for traffic surface
    },
    deals: {
      volume: dealsActive,
      closeRate: dealsActive === 0 ? 0 : dealsClosed / (dealsActive + dealsClosed),
      stageDistribution,
    },
    esg: {
      avgScore: esgAvg._avg.compositeScore || 0,
      upgradeActivity: esgActivity,
    },
    rollout: {
      activeRollouts: activeRollouts,
      successRate: activeRollouts === 0 ? 0 : rolloutSuccess / activeRollouts,
    },
    agents: {
      decisionsCount: agentDecisions,
      successSignals: agentSuccess,
    },
    revenue: revenueRows[0] ? {
      mrr: Number(revenueRows[0].mrr),
      growth: mrrGrowth,
    } : undefined,
  };
}
