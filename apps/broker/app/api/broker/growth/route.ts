import { brokerOpsFlags } from "@/config/feature-flags";
import { requireBrokerResidentialSession } from "@/lib/broker/residential-access";
import { brokerWorkspaceAuditKeys, logBrokerWorkspaceEvent } from "@/lib/broker/broker-workspace-audit";
import { buildBrokerGrowthDashboardSnapshot } from "@/modules/broker-growth/broker-growth-aggregation.service";
import { brokerGrowthDisclaimer } from "@/modules/broker-growth/broker-growth-explainer";
import { getBrokerGrowthGoals, buildGrowthRecommendations } from "@/modules/broker-growth-coach/growth-coach.service";
import type { KpiWindow } from "@/modules/broker-kpis/broker-kpis.types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await requireBrokerResidentialSession();
  if ("response" in session) return session.response;
  if (!brokerOpsFlags.personalBrokerGrowthDashboardV1) {
    return Response.json({ error: "Growth dashboard disabled" }, { status: 403 });
  }

  const url = new URL(request.url);
  const window = (url.searchParams.get("window") ?? "30d") as KpiWindow;
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;
  const custom = from && to ? { from, to } : undefined;

  const dash = await buildBrokerGrowthDashboardSnapshot(session.userId, window, custom);

  let coaching = null as ReturnType<typeof buildGrowthRecommendations> | null;
  if (brokerOpsFlags.brokerGrowthCoachV1) {
    const goals = await getBrokerGrowthGoals(session.userId);
    coaching = buildGrowthRecommendations({
      metrics: dash.growth,
      goals: goals
        ? {
            monthlyLeadTarget: goals.monthlyLeadTarget,
            monthlyClosingTarget: goals.monthlyClosingTarget,
            responseTimeHoursTarget: goals.responseTimeHoursTarget,
            listingConversionRateTarget: goals.listingConversionRateTarget,
            followUpDisciplineTarget: goals.followUpDisciplineTarget,
          }
        : null,
    });
  }

  await logBrokerWorkspaceEvent({
    actorUserId: session.userId,
    actionKey: brokerWorkspaceAuditKeys.growthDashboardViewed,
    payload: { window },
  });

  return Response.json({
    snapshot: {
      kpi: dash.kpi,
      growth: dash.growth,
      residentialScopeNote: dash.residentialScopeNote,
      coaching,
      disclaimer: brokerGrowthDisclaimer(),
    },
  });
}
