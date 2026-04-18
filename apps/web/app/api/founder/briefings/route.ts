import { executiveDashboardFlags, founderWorkspaceFlags } from "@/config/feature-flags";
import { brokerWorkspaceAuditKeys, logBrokerWorkspaceEvent } from "@/lib/broker/broker-workspace-audit";
import { requireExecutiveSession } from "@/modules/owner-access/owner-access.service";
import { listBriefingsForScope } from "@/modules/executive-briefing/briefing-history.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireExecutiveSession();
  if ("response" in session) return session.response;
  if (!executiveDashboardFlags.executiveCompanyMetricsV1 || !founderWorkspaceFlags.weeklyExecutiveBriefingV1) {
    return Response.json({ error: "Executive briefings disabled" }, { status: 403 });
  }

  const briefings = await listBriefingsForScope(session.scope, session.userId);

  await logBrokerWorkspaceEvent({
    actorUserId: session.userId,
    actionKey: brokerWorkspaceAuditKeys.founderBriefingViewed,
    payload: { list: true },
  });

  return Response.json({ briefings });
}
