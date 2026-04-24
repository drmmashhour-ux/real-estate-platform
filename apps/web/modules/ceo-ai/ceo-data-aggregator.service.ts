import { prisma } from "@/lib/db";
import { CeoContext } from "./ceo.types";

export class CeoDataAggregatorService {
  static async buildCeoContext(): Promise<CeoContext> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // 1. Growth Metrics
    const [leadsCount, prevLeadsCount] = await Promise.all([
      prisma.lead.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.lead.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
    ]);

    const growthTrend = prevLeadsCount === 0 ? 0 : (leadsCount - prevLeadsCount) / prevLeadsCount;

    // 2. Deal Pipeline
    const [deals, closedDeals, rejectedDeals] = await Promise.all([
      prisma.deal.findMany({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.deal.count({ where: { createdAt: { gte: thirtyDaysAgo }, status: "CLOSED" } }),
      prisma.deal.count({ where: { createdAt: { gte: thirtyDaysAgo }, status: "REJECTED" } }),
    ]);

    const stageDistribution: Record<string, number> = {};
    deals.forEach((d) => {
      stageDistribution[d.status] = (stageDistribution[d.status] || 0) + 1;
    });

    const closeRate = deals.length === 0 ? 0 : closedDeals / deals.length;
    const avgRejectionRate = deals.length === 0 ? 0 : rejectedDeals / deals.length;

    // 3. ESG Metrics
    const [esgProfiles, upgradeActivity] = await Promise.all([
      prisma.esgProfile.findMany({ where: { updatedAt: { gte: thirtyDaysAgo } } }),
      prisma.esgProfile.count({ where: { updatedAt: { gte: thirtyDaysAgo }, renovation: true } }),
    ]);

    const avgEsgScore = esgProfiles.length === 0 ? 0 : 
      esgProfiles.reduce((acc, p) => acc + (p.compositeScore || 0), 0) / esgProfiles.length;
    
    const adoptionRate = esgProfiles.length === 0 ? 0 : upgradeActivity / esgProfiles.length;

    // 4. Rollout Metrics (Using CityRolloutEvent as proxy for active rollouts)
    const activeRollouts = await prisma.cityRolloutEvent.count({
      where: { createdAt: { gte: thirtyDaysAgo } }
    });

    // 5. Agent Activity
    const [agentRuns, activeAgents] = await Promise.all([
      prisma.agentRun.findMany({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.agentRun.count({ where: { createdAt: { gte: thirtyDaysAgo }, status: "RUNNING" } }),
    ]);

    const successRuns = agentRuns.filter(r => r.status === "COMPLETED").length;
    const successSignals = agentRuns.length === 0 ? 0 : successRuns / agentRuns.length;

    // 6. Revenue (Placeholder if no dedicated model found, or use Deal closed price)
    // Assuming closed deals have a price/commission.
    const revenueTrend = 0; // Placeholder

    return {
      growth: {
        leadsCount,
        conversionRate: closeRate, // Using close rate as conversion proxy
        trafficVolume: 0, // Placeholder
        trend: growthTrend,
      },
      deals: {
        volume: deals.length,
        closeRate,
        stageDistribution,
        avgRejectionRate,
      },
      esg: {
        avgScore: avgEsgScore,
        upgradeActivity,
        adoptionRate,
      },
      rollout: {
        activeCount: activeRollouts,
        successRate: 0.9, // Placeholder
        failureSignals: [],
      },
      agents: {
        decisionsCount: agentRuns.length,
        successSignals,
        activeAgents,
      },
      revenue: {
        total: 0,
        mrr: 0,
        trend: revenueTrend,
      },
      timestamp: now,
    };
  }
}
