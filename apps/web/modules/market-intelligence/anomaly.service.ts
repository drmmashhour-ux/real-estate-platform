import type { CoreMetricsBundle } from "@/modules/metrics/metrics.types";
import type { AnomalyFlag } from "./market-intelligence.types";

/** Rule-based anomaly flags — thresholds are conservative to reduce noise from small denominators. */
export function detectMetricAnomalies(current: CoreMetricsBundle, prior: CoreMetricsBundle): AnomalyFlag[] {
  const flags: AnomalyFlag[] = [];

  const newListingsSlowdown =
    prior.marketplace.newListingsInRange > 18 &&
    current.marketplace.newListingsInRange < prior.marketplace.newListingsInRange * 0.65;
  if (newListingsSlowdown) {
    flags.push({
      code: "new_listings_down",
      message: `New listings dropped materially vs prior period (${current.marketplace.newListingsInRange} vs ${prior.marketplace.newListingsInRange}).`,
      severity: "medium",
    });
  }

  const revDrop =
    prior.revenue.totalRevenueCents > 5000 &&
    current.revenue.totalRevenueCents < prior.revenue.totalRevenueCents * 0.75;
  if (revDrop) {
    flags.push({
      code: "revenue_down",
      message: "Platform revenue in range is materially lower than the prior equal-length window.",
      severity: "high",
    });
  }

  const ctrCrash = prior.engagement.ctr > 0.01 && current.engagement.ctr < prior.engagement.ctr * 0.5;
  if (ctrCrash) {
    flags.push({
      code: "ctr_drop",
      message: "CTR fell sharply vs prior period — verify impression logging coverage.",
      severity: "medium",
    });
  }

  return flags;
}
