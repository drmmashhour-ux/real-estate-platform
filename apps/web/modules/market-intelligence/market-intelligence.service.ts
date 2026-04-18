import { getCoreMetricsBundle, type MetricsRequest } from "@/modules/metrics/metrics.service";
import { previousPeriod } from "@/modules/metrics/timeseries.service";
import { generateMarketInsights } from "./market-intelligence.engine";
import { detectMetricAnomalies } from "./anomaly.service";
import type { AnomalyFlag, MarketInsight } from "./market-intelligence.types";

export async function getMarketIntelligenceBundle(req: MetricsRequest): Promise<{
  insights: MarketInsight[];
  anomalies: AnomalyFlag[];
}> {
  const current = await getCoreMetricsBundle(req);
  const prev = previousPeriod(req.from, req.toExclusive);
  const prior = await getCoreMetricsBundle({ ...req, from: prev.from, toExclusive: prev.toExclusive });
  return {
    insights: generateMarketInsights(current, prior),
    anomalies: detectMetricAnomalies(current, prior),
  };
}
