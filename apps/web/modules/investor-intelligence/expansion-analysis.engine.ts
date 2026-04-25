import { prisma } from "@repo/db";
import { investIntelLog } from "./investor-intel-logger";
import type { InvestmentOpportunity, InvestmentRisk, MarketExpansionCandidate } from "./investor-intelligence.types";
import { analyzeRoiPerformance } from "./roi-engine.service";

/**
 * Market / segment opportunities from platform activity only; not external market prophecy.
 */
export async function evaluateExpansionOpportunities(): Promise<{
  topMarkets: MarketExpansionCandidate[];
  topSegments: InvestmentOpportunity[];
  risks: InvestmentRisk[];
  capacityNotes: string[];
}> {
  const risks: InvestmentRisk[] = [];
  const capacityNotes: string[] = [];
  const topMarkets: MarketExpansionCandidate[] = [];
  const topSegments: InvestmentOpportunity[] = [];
  try {
    const ri = await analyzeRoiPerformance({ persist: false, lookbackDays: 180 });
    const mkt = ri.filter((r) => r.scopeType === "MARKET");
    for (const r of mkt) {
      topMarkets.push({
        marketKey: r.scopeKey,
        openDeals: 0,
        wonDeals: r.wonDeals,
        avgValue: r.wonDeals > 0 ? r.revenue / r.wonDeals : null,
      });
    }
    topMarkets.sort((a, b) => b.wonDeals - a.wonDeals);
    for (const r of ri.filter((x) => x.scopeType === "SEGMENT").slice(0, 6)) {
      topSegments.push({
        scopeKey: r.scopeKey,
        scopeType: "SEGMENT",
        score: r.efficiencyScore ?? 0,
        rationale: r.trace.slice(0, 2),
      });
    }
    try {
      const from = new Date();
      from.setDate(from.getDate() - 90);
      const open = await prisma.deal.count({ where: { status: { notIn: ["closed", "cancelled"] }, updatedAt: { gte: from } } });
      if (open > 500) {
        capacityNotes.push("High open-deal count in the window: review broker capacity and tooling before new market expansion.");
        risks.push({
          type: "capacity",
          message: "Pipeline may be service-constrained relative to new broker hiring.",
          dataTrace: "deals not terminal count (90d)",
        });
      }
    } catch {
      /* */
    }
    investIntelLog.expand({ markets: topMarkets.length });
    return { topMarkets: topMarkets.slice(0, 10), topSegments, risks, capacityNotes };
  } catch (e) {
    investIntelLog.warn("evaluateExpansion", { err: e instanceof Error ? e.message : String(e) });
    return { topMarkets: [], topSegments: [], risks, capacityNotes };
  }
}
