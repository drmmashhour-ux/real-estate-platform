import { brokerOpsFlags } from "@/config/feature-flags";
import { requireBrokerResidentialSession } from "@/lib/broker/residential-access";
import { getBrokerGrowthTimeseries } from "@/modules/broker-growth/broker-growth-timeseries.service";
import type { GrowthTimeseriesMetricId } from "@/modules/broker-growth/broker-growth.types";
import type { KpiWindow } from "@/modules/broker-kpis/broker-kpis.types";

export const dynamic = "force-dynamic";

const METRICS: GrowthTimeseriesMetricId[] = [
  "new_leads",
  "listing_views",
  "listing_inquiries",
  "closed_deals",
  "broker_revenue_cents",
];

export async function GET(request: Request) {
  const session = await requireBrokerResidentialSession();
  if ("response" in session) return session.response;
  if (!brokerOpsFlags.personalBrokerGrowthDashboardV1) {
    return Response.json({ error: "Growth dashboard disabled" }, { status: 403 });
  }

  const url = new URL(request.url);
  const window = (url.searchParams.get("window") ?? "30d") as KpiWindow;
  const metric = (url.searchParams.get("metric") ?? "new_leads") as GrowthTimeseriesMetricId;
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;
  const custom = from && to ? { from, to } : undefined;

  if (!METRICS.includes(metric)) {
    return Response.json({ error: "Unknown metric" }, { status: 400 });
  }

  const series = await getBrokerGrowthTimeseries(session.userId, metric, window, custom);
  return Response.json({ series });
}
