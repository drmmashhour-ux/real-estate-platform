import { executiveDashboardFlags } from "@/config/feature-flags";
import { brokerWorkspaceAuditKeys, logBrokerWorkspaceEvent } from "@/lib/broker/broker-workspace-audit";
import { requireExecutiveSession } from "@/modules/owner-access/owner-access.service";
import { buildCompanyForecast } from "@/modules/company-forecasting/company-forecasting.service";
import type { KpiWindow } from "@/modules/broker-kpis/broker-kpis.types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await requireExecutiveSession();
  if ("response" in session) return session.response;
  if (!executiveDashboardFlags.companyForecastingV1 || !executiveDashboardFlags.executiveCompanyMetricsV1) {
    return Response.json({ error: "Forecasting disabled" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as { window?: KpiWindow; horizonDays?: number; from?: string; to?: string };
  const window = (body.window ?? "30d") as KpiWindow;
  const horizonDays = Math.min(180, Math.max(7, Number(body.horizonDays ?? 30)));
  const custom =
    body.from && body.to ? { from: body.from, to: body.to } : undefined;

  const forecast = await buildCompanyForecast(session.scope, window, custom, horizonDays);

  await logBrokerWorkspaceEvent({
    actorUserId: session.userId,
    actionKey: brokerWorkspaceAuditKeys.ownerScenarioGenerated,
    payload: {
      horizonDays,
      window,
      assumptions: forecast.metrics.flatMap((m) => m.assumptions).slice(0, 8),
    },
  });

  return Response.json({ forecast });
}
