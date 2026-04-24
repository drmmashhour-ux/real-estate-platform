import { prisma } from "@/lib/db";
import { 
  CeoSnapshot, 
  CeoInsight, 
  CeoDecisionRecommendation 
} from "@prisma/client";

export class CeoAggregationService {
  /**
   * Aggregates strategic data from across the entire platform.
   */
  static async aggregatePlatformData(): Promise<any> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      dealPipeline,
      portfolioStats,
      pricingPerformance,
      investorActivity,
      revenueStats,
      executionStats,
      esgStats,
      crmStats
    ] = await Promise.all([
      this.getDealPipelineMetrics(thirtyDaysAgo),
      this.getPortfolioMetrics(thirtyDaysAgo),
      this.getPricingMetrics(thirtyDaysAgo),
      this.getInvestorMetrics(thirtyDaysAgo),
      this.getRevenueMetrics(thirtyDaysAgo),
      this.getExecutionMetrics(thirtyDaysAgo),
      this.getEsgMetrics(thirtyDaysAgo),
      this.getCrmMetrics(thirtyDaysAgo)
    ]);

    return {
      dealPipeline,
      portfolioStats,
      pricingPerformance,
      investorActivity,
      revenueStats,
      executionStats,
      esgStats,
      crmStats,
      timestamp: new Date()
    };
  }

  private static async getDealPipelineMetrics(since: Date) {
    const deals = await prisma.deal.findMany({
      where: { createdAt: { gte: since } },
      select: { id: true, status: true, priceCents: true, createdAt: true }
    });

    const closed = deals.filter(d => d.status === "CLOSED");
    const rejected = deals.filter(d => d.status === "REJECTED");

    return {
      volume: deals.length,
      closedVolume: closed.length,
      rejectedVolume: rejected.length,
      closeRate: deals.length > 0 ? closed.length / deals.length : 0,
      totalValue: deals.reduce((sum, d) => sum + (Number(d.priceCents) || 0) / 100, 0),
      avgTimeToClose: 0 // Placeholder for actual calculation
    };
  }

  private static async getPortfolioMetrics(since: Date) {
    // Aggregating from FundPerformanceSnapshot as proxy for portfolio performance
    const snapshots = await prisma.fundPerformanceSnapshot.findMany({
      where: { timestamp: { gte: since } },
      orderBy: { timestamp: "desc" }
    });

    return {
      avgRoi: snapshots.length > 0 ? snapshots[0].navValue / snapshots[snapshots.length - 1].navValue - 1 : 0,
      totalNav: snapshots.length > 0 ? snapshots[0].navValue : 0
    };
  }

  private static async getPricingMetrics(since: Date) {
    const overrides = await prisma.leadPricingOverride.count({
      where: { createdAt: { gte: since } }
    });

    return {
      activeOverrides: overrides,
      efficiency: 0.85 // Placeholder
    };
  }

  private static async getInvestorMetrics(since: Date) {
    const investments = await prisma.amfInvestment.findMany({
      where: { createdAt: { gte: since } },
      select: { amount: true }
    });

    return {
      newCapital: investments.reduce((sum, i) => sum + (Number(i.amount) || 0), 0),
      investorCount: await prisma.amfInvestor.count()
    };
  }

  private static async getRevenueMetrics(since: Date) {
    // Assuming revenue comes from closed deals or a dedicated model
    return {
      mrr: 0,
      arr: 0,
      taxExposure: "LOW"
    };
  }

  private static async getExecutionMetrics(since: Date) {
    const tasks = await prisma.executiveTask.findMany({
      where: { createdAt: { gte: since } },
      select: { status: true }
    });

    const completed = tasks.filter(t => t.status === "COMPLETED").length;

    return {
      taskVolume: tasks.length,
      successRate: tasks.length > 0 ? completed / tasks.length : 0
    };
  }

  private static async getEsgMetrics(since: Date) {
    const profiles = await prisma.esgProfile.findMany();
    return {
      avgScore: profiles.length > 0 ? profiles.reduce((sum, p) => sum + (p.compositeScore || 0), 0) / profiles.length : 0,
      retrofitActivity: profiles.filter(p => p.renovation).length
    };
  }

  private static async getCrmMetrics(since: Date) {
    const leads = await prisma.lead.count({ where: { createdAt: { gte: since } } });
    return {
      leadInflow: leads,
      conversionRate: 0.12 // Placeholder
    };
  }
}
