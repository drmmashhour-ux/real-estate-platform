import { executiveDashboardFlags, founderWorkspaceFlags } from "@/config/feature-flags";
import { brokerWorkspaceAuditKeys, logBrokerWorkspaceEvent } from "@/lib/broker/broker-workspace-audit";
import { requireExecutiveSession } from "@/modules/owner-access/owner-access.service";
import { buildFounderIntelligenceSnapshot } from "@/modules/founder-intelligence/founder-intelligence.service";
import { buildCompanyInsights } from "@/modules/company-insights/company-insights.service";
import { getFounderCopilotPayload } from "@/modules/founder-copilot/founder-copilot.service";
import { founderCopilotDisclaimer } from "@/modules/founder-copilot/founder-copilot.explainer";
import { buildExecutiveAnalytics } from "@/modules/executive-analytics/executive-analytics.service";
import type { KpiWindow } from "@/modules/broker-kpis/broker-kpis.types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await requireExecutiveSession();
  if ("response" in session) return session.response;
  if (!executiveDashboardFlags.executiveCompanyMetricsV1) {
    return Response.json({ error: "Executive company metrics disabled" }, { status: 403 });
  }
  if (!founderWorkspaceFlags.founderAiCopilotV1) {
    return Response.json({ error: "Founder copilot disabled" }, { status: 403 });
  }

  const url = new URL(request.url);
  const window = (url.searchParams.get("window") ?? "30d") as KpiWindow;
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;
  const custom = from && to ? { from, to } : undefined;

  const [snapshot, copilot, analytics] = await Promise.all([
    buildFounderIntelligenceSnapshot(session.scope, window, session.userId, custom),
    getFounderCopilotPayload(session, window, custom),
    buildExecutiveAnalytics(session.scope, session.userId),
  ]);

  const insights =
    founderWorkspaceFlags.companyInsightSynthesisV1
      ? (await buildCompanyInsights(snapshot)).insights
      : [];

  await logBrokerWorkspaceEvent({
    actorUserId: session.userId,
    actionKey: brokerWorkspaceAuditKeys.founderWorkspaceViewed,
    payload: { window, scope: session.scope.kind },
  });

  return Response.json({
    disclaimer: founderCopilotDisclaimer,
    window,
    intelligence: snapshot,
    insights,
    copilot,
    analytics,
  });
}
