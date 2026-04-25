import { prisma } from "@repo/db";
import { investIntelLog } from "./investor-intel-logger";
import type { InvestorSnapshotBundle, InvestorSnapshotView } from "./investor-intelligence.types";
import { generateCapitalAllocationRecommendations } from "./capital-allocation.engine";
import { evaluateExpansionOpportunities } from "./expansion-analysis.engine";
import { buildInvestorAlerts } from "./investor-alerts.service";
import { analyzeRoiPerformance } from "./roi-engine.service";
import { engineFlags } from "@/config/feature-flags";

// investorIntelligenceV1 gates heavy writes; snapshot still read-only if off with degraded mode

const DISCLAIMER =
  "Platform operational intelligence, not GAAP, not a valuation, not a promise. Trace fields document sources.";

/**
 * Assembles a board-style snapshot. Persists a row (best-effort) for audit.
 */
export async function buildInvestorSnapshot(periodKey = "30d_rolling_v1", opts?: { writeDb?: boolean }): Promise<InvestorSnapshotView> {
  const dataSources: string[] = [
    "deals (jurisdiction, broker, crm, lead leadSource) — terminal outcomes in window",
    "strategy_performance_aggregates (optional) for product strategy mix",
  ];
  if (!engineFlags.brokerageIntelligenceV1) {
    dataSources.push("brokerage intelligence flag off — some cross-refs skipped");
  }
  try {
    const ri = await analyzeRoiPerformance({ persist: true, lookbackDays: 90 });
    const from = new Date();
    from.setDate(from.getDate() - 90);
    const [wins, openDeals, leadRows] = await Promise.all([
      prisma.deal.count({ where: { status: { equals: "closed" }, updatedAt: { gte: from } } }).catch(() => 0),
      prisma.deal
        .findMany({ where: { status: { notIn: ["closed", "cancelled"] } }, take: 2000, select: { priceCents: true } })
        .catch(() => [] as { priceCents: number }[]),
      prisma.lead.aggregate({ _sum: { dynamicLeadPriceCents: true } }).catch(() => ({ _sum: { dynamicLeadPriceCents: null } })),
    ]);
    const pipeline$ = openDeals.reduce((s, d) => s + d.priceCents, 0) * 0.01;
    const topSeg = ri.filter((r) => r.scopeType === "MARKET" || r.scopeType === "SEGMENT").slice(0, 8);
    const weak = [...ri]
      .filter((r) => (r.wonDeals + r.lostDeals) > 1)
      .sort((a, b) => (a.efficiencyScore ?? 0) - (b.efficiencyScore ?? 0))
      .slice(0, 5);
    const allocs = await generateCapitalAllocationRecommendations();
    const ex = await evaluateExpansionOpportunities();
    const alertItems = await buildInvestorAlerts(ri, pipeline$);
    const view: InvestorSnapshotView = {
      periodKey,
      totalRevenue: Math.round(ri.reduce((s, r) => s + r.revenue, 0) * 100) / 100,
      totalWonDeals: wins,
      totalLeadSpend: leadRows?._sum?.dynamicLeadPriceCents != null
        ? Number(leadRows._sum.dynamicLeadPriceCents) * 0.01
        : null,
      estimatedPipelineValue: pipeline$ > 0 ? Math.round(pipeline$ * 100) / 100 : null,
      avgDealCycleDays: null,
      topSegmentJson: topSeg,
      weakSegmentJson: weak,
      capitalAllocationJson: allocs,
      riskSummaryJson: { items: ex.risks, capacity: ex.capacityNotes, alertCount: alertItems.length },
      dataSources,
      disclaimer: DISCLAIMER,
    };
    if (opts?.writeDb !== false && engineFlags.investorIntelligenceV1) {
      try {
        await prisma.investorSnapshot.create({
          data: {
            periodKey: view.periodKey,
            totalRevenue: view.totalRevenue,
            totalWonDeals: view.totalWonDeals,
            totalLeadSpend: view.totalLeadSpend,
            estimatedPipelineValue: view.estimatedPipelineValue,
            avgDealCycleDays: view.avgDealCycleDays,
            topSegmentJson: view.topSegmentJson as object,
            weakSegmentJson: view.weakSegmentJson as object,
            capitalAllocationJson: view.capitalAllocationJson as object,
            riskSummaryJson: view.riskSummaryJson as object,
          },
        });
      } catch {
        /* */
      }
    }
    investIntelLog.snapshot({ period: periodKey });
    return { ...view, expansion: ex, alertItems, roi: ri };
  } catch (e) {
    investIntelLog.warn("buildInvestorSnapshot", { err: e instanceof Error ? e.message : String(e) });
    return {
      periodKey,
      totalRevenue: 0,
      totalWonDeals: 0,
      totalLeadSpend: null,
      estimatedPipelineValue: null,
      avgDealCycleDays: null,
      topSegmentJson: [],
      weakSegmentJson: [],
      capitalAllocationJson: [],
      riskSummaryJson: { error: "unavailable" },
      dataSources: [],
      disclaimer: DISCLAIMER,
      expansion: { topMarkets: [], topSegments: [], risks: [], capacityNotes: [] },
      alertItems: [],
      roi: [],
    };
  }
}
