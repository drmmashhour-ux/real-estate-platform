import { brokerOpsFlags } from "@/config/feature-flags";
import { requireBrokerResidentialSession } from "@/lib/broker/residential-access";
import { getBrokerKpiTimeseries } from "@/modules/broker-kpis/broker-kpi-timeseries.service";
import type { KpiWindow, TimeseriesMetricId } from "@/modules/broker-kpis/broker-kpis.types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await requireBrokerResidentialSession();
  if ("response" in session) return session.response;
  if (!brokerOpsFlags.brokerKpiBoardV1) {
    return Response.json({ error: "Broker KPI board disabled" }, { status: 403 });
  }

  const url = new URL(request.url);
  const metric = (url.searchParams.get("metric") ?? "new_leads") as TimeseriesMetricId;
  const window = (url.searchParams.get("window") ?? "30d") as KpiWindow;
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;
  const custom = from && to ? { from, to } : undefined;

  const series = await getBrokerKpiTimeseries(session.userId, metric, window, custom);
  return Response.json({ series });
}
