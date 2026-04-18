import { executiveDashboardFlags } from "@/config/feature-flags";
import { requireExecutiveSession } from "@/modules/owner-access/owner-access.service";
import { buildCompanyForecast } from "@/modules/company-forecasting/company-forecasting.service";
import type { KpiWindow } from "@/modules/broker-kpis/broker-kpis.types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await requireExecutiveSession();
  if ("response" in session) return session.response;
  if (!executiveDashboardFlags.companyForecastingV1 || !executiveDashboardFlags.executiveCompanyMetricsV1) {
    return Response.json({ error: "Forecasting disabled" }, { status: 403 });
  }

  const url = new URL(request.url);
  const window = (url.searchParams.get("window") ?? "30d") as KpiWindow;
  const horizonDays = Math.min(180, Math.max(7, Number(url.searchParams.get("horizonDays") ?? "30")));
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;
  const custom = from && to ? { from, to } : undefined;

  const forecast = await buildCompanyForecast(session.scope, window, custom, horizonDays);
  return Response.json({ forecast });
}
