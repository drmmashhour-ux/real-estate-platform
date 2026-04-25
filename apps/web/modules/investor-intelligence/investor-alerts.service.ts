import { investIntelLog } from "./investor-intel-logger";
import type { InvestorAlert, RoiInsight } from "./investor-intelligence.types";

/**
 * Business-rule alerts; severity is observational, not a legal classification.
 */
export async function buildInvestorAlerts(ri: RoiInsight[], pipelineDollars: number): Promise<InvestorAlert[]> {
  const a: InvestorAlert[] = [];
  try {
    if (pipelineDollars > 50_000_000) {
      a.push({
        type: "pipeline",
        severity: "medium",
        message: "Open pipeline (rough notional) is very large in this pull — treat as concentration / data-quality risk, not a promise of revenue.",
        rationale: "Sum of list prices for non-terminal deals in sample (operational, not bank exposure).",
        suggestedResponse: "Reconcile a sample; stress-test broker capacity before new GTM spend.",
      });
    }
    const mkt = ri.find((r) => r.scopeType === "MARKET" && (r.wonDeals + r.lostDeals) > 5);
    if (mkt && (mkt.roiScore ?? 0) < 0.3) {
      a.push({
        type: "roi",
        severity: "medium",
        message: "A major market shows weak efficiency band in the sample; review GTM, not people.",
        rationale: `Scope ${mkt.scopeKey} composite below threshold; trace: ${mkt.trace[0] ?? "n/a"}.`,
        suggestedResponse: "Segment drill-down with ops; consider experiments before cuts.",
      });
    }
    const str = ri.filter((r) => (r.wonDeals + r.lostDeals) > 4).sort((x, y) => (y.efficiencyScore ?? 0) - (x.efficiencyScore ?? 0))[0];
    if (str && (str.efficiencyScore ?? 0) > 0.65) {
      a.push({
        type: "opportunity",
        severity: "info",
        message: "Strong product-market signal in a slice; consider a measured budget experiment.",
        rationale: "High band vs peers in the same lookback; still assumption-based.",
        suggestedResponse: "Pair with lead routing and broker capacity before broad spend increase.",
      });
    }
    investIntelLog.alerts({ n: a.length });
    return a.slice(0, 20);
  } catch (e) {
    investIntelLog.warn("buildInvestorAlerts", { err: e instanceof Error ? e.message : String(e) });
    return [];
  }
}
