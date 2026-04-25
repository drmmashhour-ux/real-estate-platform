import { analyzeRoiPerformance } from "@/modules/investor-intelligence/roi-engine.service";
import { corporateStrategyLog } from "./corporate-strategy-logger";
import type { StrategicRisk, StrategyTriage } from "./corporate-strategy.types";

const ADV = "Risks are from platform aggregates; not legal or macro advice.";

/**
 * Data-backed, conservative risk list — not exhaustive.
 */
export async function analyzeStrategicRisks(): Promise<StrategicRisk[]> {
  const out: StrategicRisk[] = [];
  try {
    const roi = await analyzeRoiPerformance({ persist: false, lookbackDays: 150 });
    const mkt = roi.filter((r) => r.scopeType === "MARKET" && (r.wonDeals + r.lostDeals) > 0);
    if (mkt.length === 1) {
      out.push({
        type: "concentration",
        severity: "medium" as StrategyTriage,
        message: "Revenue/terminal outcomes appear dominated by a single market in the lookback (platform view).",
        rationale: "Single market bucket in aggregates — may reflect geography focus or data skew.",
        mitigation: "Validate intentional focus vs reporting blind spots; diversify if strategy requires.",
      });
    } else {
      const rev = mkt.map((x) => x.revenue);
      const tot = rev.reduce((a, b) => a + b, 0) || 1;
      for (const x of mkt) {
        if (x.revenue / tot > 0.6 && mkt.length > 1) {
          out.push({
            type: "revenue_concentration",
            severity: "low" as StrategyTriage,
            message: "One market carries a large share of reported revenue in the model window (not an audited statement).",
            rationale: `~${(100 * (x.revenue / tot)).toFixed(0)}% share: ${x.scopeKey}`,
            mitigation: "Stress-test expansion and downside scenarios with finance.",
          });
          break;
        }
      }
    }
    const n = mkt.length + roi.filter((r) => (r.wonDeals + r.lostDeals) > 0).length;
    if (n < 8) {
      out.push({
        type: "sparsity",
        severity: "high" as StrategyTriage,
        message: "Few distinct buckets with enough outcomes — confidence in any strategic split is low.",
        rationale: ADV,
        mitigation: "Extend measurement window, fix CRM linkage, and avoid over-weighting these signals in board packs.",
      });
    }
    corporateStrategyLog.risks({ n: out.length });
  } catch (e) {
    corporateStrategyLog.warn("analyzeStrategicRisks", { err: e instanceof Error ? e.message : String(e) });
  }
  if (out.length === 0) {
    return [
      {
        type: "residual",
        severity: "low" as StrategyTriage,
        message: "No automated high-severity item flagged in the default rubric; residual business risk always applies.",
        rationale: "Not a 'clean bill of health' — this layer only surface-scans aggregates.",
        mitigation: "Run leadership risk register alongside these signals.",
      },
    ];
  }
  return out;
}
