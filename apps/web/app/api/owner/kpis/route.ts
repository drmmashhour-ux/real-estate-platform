import { executiveDashboardFlags } from "@/config/feature-flags";
import { requireExecutiveSession } from "@/modules/owner-access/owner-access.service";
import { getOwnerKpiSnapshot } from "@/modules/owner-dashboard/owner-kpi.service";
import type { KpiWindow } from "@/modules/broker-kpis/broker-kpis.types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await requireExecutiveSession();
  if ("response" in session) return session.response;
  if (!executiveDashboardFlags.executiveCompanyMetricsV1) {
    return Response.json({ error: "Executive metrics disabled" }, { status: 403 });
  }

  const url = new URL(request.url);
  const window = (url.searchParams.get("window") ?? "30d") as KpiWindow;
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;
  const custom = from && to ? { from, to } : undefined;

  const metrics = await getOwnerKpiSnapshot(session.scope, window, custom);
  return Response.json({ metrics });
}
