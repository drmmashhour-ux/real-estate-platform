import { analyzeRoiPerformance } from "@/modules/investor-intelligence/roi-engine.service";
import { corporateStrategyLog } from "./corporate-strategy-logger";
import type { ProductRoadmapStrategy, RoadmapItem, StrategyTriage } from "./corporate-strategy.types";

const ADV =
  "Backlog ideas from internal signals; not a public roadmap commitment. De-prioritize does not imply deprecation without product review.";

/**
 * Feature priorities from strategy/ROI rows and conversion heuristics — no guaranteed adoption impact.
 */
export async function generateProductRoadmapStrategy(): Promise<ProductRoadmapStrategy> {
  const dataSources: string[] = [
    "strategy-related ROI scope rows (strategyPerformanceAggregate-backed STRATEGY rows when present)",
    "segment and channel efficiency bands (where to harden product vs grow go-to-market)",
  ];
  const prioritize: RoadmapItem[] = [];
  const deprioritize: RoadmapItem[] = [];
  try {
    const roi = await analyzeRoiPerformance({ persist: false, lookbackDays: 120 });
    const strat = roi.filter((r) => r.scopeType === "STRATEGY").sort((a, b) => (b.efficiencyScore ?? 0) - (a.efficiencyScore ?? 0));
    for (const s of strat.slice(0, 4)) {
      prioritize.push({
        key: `st-${s.scopeKey}`.slice(0, 80),
        title: `Harden or scale: ${s.scopeKey}`.slice(0, 120),
        priority: ((s.wonDeals + s.lostDeals) >= 10 || (s.efficiencyScore ?? 0) > 0.55 ? "medium" : "low") as StrategyTriage,
        rationale: s.trace?.slice(0, 2) ?? ["from strategy performance aggregate or proxy"],
        dataTrace: `STRATEGY scopeKey=${s.scopeKey} eff=${(s.efficiencyScore ?? 0).toFixed(2)}`,
      });
    }
    const weaks = [...roi]
      .filter((r) => (r.wonDeals + r.lostDeals) > 2 && (r.efficiencyScore ?? 0) < 0.3)
      .sort((a, b) => (a.efficiencyScore ?? 0) - (b.efficiencyScore ?? 0))
      .slice(0, 3);
    for (const w of weaks) {
      deprioritize.push({
        key: `weak-${w.scopeType}-${w.scopeKey}`.slice(0, 80),
        title: `Review before new investment: ${w.scopeType} / ${w.scopeKey}`.slice(0, 120),
        priority: "low",
        rationale: [
          "Weaker band in the same lookback; consider stabilizing or instrumenting before net-new features here.",
        ],
        dataTrace: w.trace[0] ?? "efficiency",
      });
    }
    if (prioritize.length === 0) {
      prioritize.push({
        key: "funnel-telemetry",
        title: "Improve end-to-end funnel visibility (events + CRM link quality)",
        priority: "high",
        rationale: [
          "No strong strategy rows — default safe priority is better observability before new bets (advisory).",
        ],
        dataTrace: "fallback when STRATEGY empty",
      });
    }
    corporateStrategyLog.roadmap({ p: prioritize.length, d: deprioritize.length });
  } catch (e) {
    corporateStrategyLog.warn("generateProductRoadmapStrategy", { err: e instanceof Error ? e.message : String(e) });
  }
  return { disclaimer: ADV, dataSources, prioritize, deprioritize };
}
