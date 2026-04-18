import { executiveDashboardFlags, founderWorkspaceFlags } from "@/config/feature-flags";
import { brokerWorkspaceAuditKeys, logBrokerWorkspaceEvent } from "@/lib/broker/broker-workspace-audit";
import { requireExecutiveSession } from "@/modules/owner-access/owner-access.service";
import { generateWeeklyExecutiveBriefing } from "@/modules/executive-briefing/weekly-briefing.generator";
import type { KpiWindow } from "@/modules/broker-kpis/broker-kpis.types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await requireExecutiveSession();
  if ("response" in session) return session.response;
  if (!executiveDashboardFlags.executiveCompanyMetricsV1 || !founderWorkspaceFlags.weeklyExecutiveBriefingV1) {
    return Response.json({ error: "Disabled" }, { status: 403 });
  }

  let window: KpiWindow = "7d";
  try {
    const body = (await request.json()) as { window?: KpiWindow };
    if (body.window) window = body.window;
  } catch {
    /* default */
  }

  const { briefingId } = await generateWeeklyExecutiveBriefing(session, window);

  await logBrokerWorkspaceEvent({
    actorUserId: session.userId,
    actionKey: brokerWorkspaceAuditKeys.founderBriefingGenerated,
    payload: { briefingId, window },
  });

  return Response.json({ briefingId });
}
