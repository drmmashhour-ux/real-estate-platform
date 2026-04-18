import { commandCenterFlags } from "@/config/feature-flags";
import { anomaliesToAlerts } from "@/modules/alerts/alert.rules";
import { computeKpiSnapshot } from "@/modules/kpi/kpi.service";
import { getCoreMetricsBundle, rangeFromDays, type MetricsRequest } from "@/modules/metrics/metrics.service";
import { parseSegmentFromSearchParams } from "@/modules/metrics/segmentation.service";
import { getMarketIntelligenceBundle } from "@/modules/market-intelligence/market-intelligence.service";
import { daysBetween, getPlatformTimeseriesDays, getPlatformTimeseriesRange } from "@/modules/metrics/timeseries.service";

export async function buildCommandCenterPayload(searchParams: URLSearchParams) {
  const daysParam = Math.min(90, Math.max(7, parseInt(searchParams.get("days") ?? "30", 10) || 30));
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  let req: MetricsRequest;
  let windowDays = daysParam;
  if (fromParam && toParam) {
    const from = new Date(fromParam);
    const toExclusive = new Date(toParam);
    req = { from, toExclusive, segment: parseSegmentFromSearchParams(searchParams) };
    windowDays = Math.min(90, Math.max(7, daysBetween(from, toExclusive)));
  } else {
    const r = rangeFromDays(daysParam);
    req = { ...r, segment: parseSegmentFromSearchParams(searchParams) };
  }

  const miOn = commandCenterFlags.marketIntelligenceDashboardV1;

  const tsPromise =
    fromParam && toParam
      ? getPlatformTimeseriesRange(fromParam.slice(0, 10), toParam.slice(0, 10))
      : getPlatformTimeseriesDays(windowDays);

  const [metrics, kpis, mi, ts] = await Promise.all([
    getCoreMetricsBundle(req),
    computeKpiSnapshot(req),
    miOn ? getMarketIntelligenceBundle(req) : Promise.resolve({ insights: [], anomalies: [] }),
    tsPromise,
  ]);

  const alerts = miOn ? anomaliesToAlerts(mi.anomalies) : [];

  return {
    metrics,
    kpis: kpis.kpis,
    priorRange: kpis.priorRange,
    insights: mi.insights,
    anomalies: mi.anomalies,
    alerts,
    timeseries: ts.platform.series,
    meta: {
      days: windowDays,
      range: metrics.range,
      marketIntelligenceEnabled: miOn,
    },
  };
}

export async function buildExecutivePayload(searchParams: URLSearchParams) {
  const p = await buildCommandCenterPayload(searchParams);
  return {
    metrics: p.metrics,
    kpis: p.kpis,
    priorRange: p.priorRange,
    timeseries: p.timeseries,
    meta: p.meta,
  };
}
