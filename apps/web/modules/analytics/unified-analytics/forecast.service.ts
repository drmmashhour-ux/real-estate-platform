import type { TimeSeriesPoint, UnifiedAnalyticsForecast } from "./unified-analytics.types";

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const v = values.reduce((s, x) => s + (x - m) ** 2, 0) / values.length;
  return Math.sqrt(v);
}

/**
 * Deterministic revenue forecast and demand spike heuristic (no ML).
 */
export function buildForecastFromSeries(params: {
  revenueDaily: TimeSeriesPoint[];
  leadDaily: TimeSeriesPoint[];
}): UnifiedAnalyticsForecast {
  const revVals = params.revenueDaily.map((p) => p.value);
  const last7 = revVals.slice(-7);
  const prev7 = revVals.slice(-14, -7);
  const avgLast = mean(last7.length ? last7 : revVals);
  const avgPrev = mean(prev7.length ? prev7 : last7);
  const growthTrendPct =
    avgPrev > 0 ? Math.round(((avgLast - avgPrev) / avgPrev) * 1000) / 10 : avgLast > 0 ? 100 : 0;

  const revenueNext30DaysCents = Math.max(0, Math.round(avgLast * 30));

  const leadVals = params.leadDaily.map((p) => p.value);
  const lm = mean(leadVals);
  const ls = stddev(leadVals);
  const lastLead = leadVals[leadVals.length - 1] ?? 0;
  const z = ls > 0 ? (lastLead - lm) / ls : 0;
  let demandSpikeRisk: UnifiedAnalyticsForecast["demandSpikeRisk"] = "low";
  if (z > 2) demandSpikeRisk = "high";
  else if (z > 1) demandSpikeRisk = "medium";

  return {
    revenueNext30DaysCents,
    growthTrendPct,
    demandSpikeRisk,
  };
}
