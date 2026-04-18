import { executiveDashboardFlags } from "@/config/feature-flags";
import { requireExecutiveSession } from "@/modules/owner-access/owner-access.service";
import { getCompanyMetricsTimeseries } from "@/modules/company-metrics/company-metrics-timeseries.service";
import type { CompanyTimeseriesMetricId } from "@/modules/company-metrics/company-metrics.types";
import type { KpiWindow } from "@/modules/broker-kpis/broker-kpis.types";

export const dynamic = "force-dynamic";

const METRICS: CompanyTimeseriesMetricId[] = [
  "closed_deals",
  "new_leads",
  "active_listings",
  "commission_cents",
  "compliance_cases",
];

export async function GET(request: Request) {
  const session = await requireExecutiveSession();
  if ("response" in session) return session.response;
  if (!executiveDashboardFlags.executiveCompanyMetricsV1) {
    return Response.json({ error: "Executive metrics disabled" }, { status: 403 });
  }

  const url = new URL(request.url);
  const window = (url.searchParams.get("window") ?? "30d") as KpiWindow;
  const metric = (url.searchParams.get("metric") ?? "closed_deals") as CompanyTimeseriesMetricId;
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;
  const custom = from && to ? { from, to } : undefined;

  if (!METRICS.includes(metric)) {
    return Response.json({ error: "Unknown metric" }, { status: 400 });
  }

  const series = await getCompanyMetricsTimeseries(session.scope, metric, window, custom);
  return Response.json({ series });
}
