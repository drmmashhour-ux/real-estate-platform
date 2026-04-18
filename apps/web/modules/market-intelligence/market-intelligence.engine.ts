import type { CoreMetricsBundle } from "@/modules/metrics/metrics.types";
import type { MarketInsight } from "./market-intelligence.types";

function id(): string {
  return `mi_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Deterministic, explainable insights — no ML. Uses liquidity rows + period deltas.
 */
export function generateMarketInsights(current: CoreMetricsBundle, prior: CoreMetricsBundle): MarketInsight[] {
  const insights: MarketInsight[] = [];

  for (const row of current.supplyDemand.topAreas.slice(0, 5)) {
    if (row.ratio > 58) {
      insights.push({
        id: id(),
        severity: "info",
        title: `Strong demand signal: ${row.city}`,
        detail: `Liquidity score ${row.ratio.toFixed(0)} with ${row.views7d} views and ${row.saves7d} saves (7d internal window).`,
        basedOn: ["liquidity.engine", "event_logs", "fsbo_listings"],
      });
    }
    if (row.activeListings > 40 && row.views7d < 20) {
      insights.push({
        id: id(),
        severity: "watch",
        title: `Possible oversupply: ${row.city}`,
        detail: `${row.activeListings} active listings vs modest 7d views — monitor conversion.`,
        basedOn: ["liquidity.engine"],
      });
    }
  }

  const ng = current.marketplace.listingGrowthRate;
  if (ng != null && ng > 0.15) {
    insights.push({
      id: id(),
      severity: "info",
      title: "Listing intake accelerated",
      detail: `New listings grew ~${(ng * 100).toFixed(0)}% vs prior period (segment-aware count).`,
      basedOn: ["fsbo_listings", "short_term_listings", "listings"],
    });
  }

  const dCtr = current.engagement.ctr - prior.engagement.ctr;
  if (Math.abs(dCtr) > 0.005) {
    insights.push({
      id: id(),
      severity: "watch",
      title: dCtr > 0 ? "CTR improved vs prior window" : "CTR softened vs prior window",
      detail: `CTR moved from ${(prior.engagement.ctr * 100).toFixed(2)}% to ${(current.engagement.ctr * 100).toFixed(2)}%.`,
      basedOn: ["event_logs"],
    });
  }

  return insights.slice(0, 12);
}
