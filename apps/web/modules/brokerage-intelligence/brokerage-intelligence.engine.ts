import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { engineFlags } from "@/config/feature-flags";
import { computeBrokerLoadMetrics, recommendLoadRebalancing } from "./broker-load.service";
import { computeDealPriority } from "./deal-priority.engine";
import { recommendBrokerForLead } from "./lead-routing.engine";
import { analyzeSegmentPerformance } from "./segment-intelligence.service";
import { portfolioIntelLog } from "./brokerage-intelligence-logger";
import type { DealPortfolioSlice, LeadPortfolioSlice } from "./brokerage-intelligence.types";
import { touchStrategyBenchmarkHint } from "./brokerage-intelligence.integrations";

export type PortfolioAnalysisResult = {
  leadRoutingSuggestions: Awaited<ReturnType<typeof recommendBrokerForLead>>[];
  dealPriorities: { dealId: string; result: ReturnType<typeof computeDealPriority> }[];
  brokerLoadInsights: Awaited<ReturnType<typeof computeBrokerLoadMetrics>>;
  loadRebalancing: Awaited<ReturnType<typeof recommendLoadRebalancing>>;
  segmentInsights: Awaited<ReturnType<typeof analyzeSegmentPerformance>>;
  alerts: string[];
  snapshotId: string | null;
};

/**
 * Orchestrates portfolio views; never mutates assignments.
 */
export async function runPortfolioAnalysis(params: {
  leadSamples?: LeadPortfolioSlice[];
  dealSamples?: DealPortfolioSlice[];
}): Promise<PortfolioAnalysisResult> {
  const alerts: string[] = [];
  const defaultResult: PortfolioAnalysisResult = {
    leadRoutingSuggestions: [],
    dealPriorities: [],
    brokerLoadInsights: [],
    loadRebalancing: { suggestions: [], rationale: [] },
    segmentInsights: {
      best: [],
      weak: [],
      bySegment: [],
      rationale: [],
    },
    alerts: ["Brokerage intelligence disabled or unavailable; no automatic changes were made."],
    snapshotId: null,
  };
  if (!engineFlags.brokerageIntelligenceV1) return defaultResult;
  try {
    void touchStrategyBenchmarkHint("portfolio_run");
    const [load, rebal, seg] = await Promise.all([
      computeBrokerLoadMetrics(),
      recommendLoadRebalancing(),
      analyzeSegmentPerformance(),
    ]);
    for (const m of load) {
      if (m.workloadScore >= 85) alerts.push(`Broker ${m.brokerId.slice(0, 8)}… has high combined load (suggestion: review distribution).`);
    }
    const leadRoutingSuggestions: Awaited<ReturnType<typeof recommendBrokerForLead>>[] = [];
    for (const l of params.leadSamples ?? []) {
      const r = await recommendBrokerForLead(l);
      leadRoutingSuggestions.push(r);
    }
    const dealPriorities: { dealId: string; result: ReturnType<typeof computeDealPriority> }[] = [];
    for (const d of params.dealSamples ?? []) {
      const result = computeDealPriority(d);
      if (result.priorityScore >= 78 && (result.riskLevel === "high" || result.urgencyLevel === "high")) {
        alerts.push(`High-value or hot attention deal ${d.id.slice(0, 8)}… (priority ${result.priorityScore.toFixed(0)}; review, not a guarantee).`);
      }
      dealPriorities.push({ dealId: d.id, result });
    }
    for (const s of seg.weak) {
      if (s.totalDeals >= 3) {
        alerts.push(`Segment “${s.segmentKey.slice(0, 64)}” shows weak win rate in aggregate; interpret cautiously.`);
      }
    }
    for (const s of seg.best.slice(0, 2)) {
      if ((s.winRate ?? 0) > 0.55 && s.totalDeals >= 3) {
        alerts.push(`Strong opportunity pattern in segment “${s.segmentKey.slice(0, 48)}” (observational).`);
      }
    }
    let snapshotId: string | null = null;
    try {
      const snap = await prisma.portfolioSnapshot.create({
        data: {
          totalLeads: 0,
          totalActiveDeals: 0,
          totalWonDeals: 0,
          totalLostDeals: 0,
          avgDealCycleDays: null,
          brokerLoadDistributionJson: load as unknown as object,
          segmentPerformanceJson: seg as unknown as object,
        },
      });
      snapshotId = snap.id;
    } catch {
      /* optional */
    }
    portfolioIntelLog.analysis({ leads: leadRoutingSuggestions.length, deals: dealPriorities.length, load: load.length });
    return {
      leadRoutingSuggestions,
      dealPriorities,
      brokerLoadInsights: load,
      loadRebalancing: rebal,
      segmentInsights: seg,
      alerts: alerts.slice(0, 20),
      snapshotId,
    };
  } catch (e) {
    portfolioIntelLog.warn("runPortfolioAnalysis", { err: e instanceof Error ? e.message : String(e) });
    return {
      ...defaultResult,
      alerts: ["Analysis run failed; defaults returned."],
    };
  }
}
