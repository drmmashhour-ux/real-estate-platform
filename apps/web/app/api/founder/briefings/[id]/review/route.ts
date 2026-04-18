import { executiveDashboardFlags, founderWorkspaceFlags } from "@/config/feature-flags";
import { brokerWorkspaceAuditKeys, logBrokerWorkspaceEvent } from "@/lib/broker/broker-workspace-audit";
import { requireExecutiveSession } from "@/modules/owner-access/owner-access.service";
import { getBriefingByIdForScope } from "@/modules/executive-briefing/briefing-history.service";
import { markBriefingReviewed } from "@/modules/executive-briefing/briefing-review.service";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await requireExecutiveSession();
  if ("response" in session) return session.response;
  if (!executiveDashboardFlags.executiveCompanyMetricsV1 || !founderWorkspaceFlags.weeklyExecutiveBriefingV1) {
    return Response.json({ error: "Disabled" }, { status: 403 });
  }

  const { id } = await context.params;
  const briefing = await getBriefingByIdForScope(id, session.scope, session.userId);
  if (!briefing) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  let approved = true;
  try {
    const body = (await request.json()) as { approved?: boolean };
    if (body.approved === false) approved = false;
  } catch {
    /* default approved */
  }

  if (approved) {
    await markBriefingReviewed(id, session.userId);
  }

  await logBrokerWorkspaceEvent({
    actorUserId: session.userId,
    actionKey: brokerWorkspaceAuditKeys.founderBriefingReviewed,
    payload: { briefingId: id, approved },
  });

  return Response.json({ ok: true, reviewed: approved });
}
