import { executiveDashboardFlags, founderWorkspaceFlags } from "@/config/feature-flags";
import { brokerWorkspaceAuditKeys, logBrokerWorkspaceEvent } from "@/lib/broker/broker-workspace-audit";
import { requireExecutiveSession } from "@/modules/owner-access/owner-access.service";
import { getBriefingByIdForScope } from "@/modules/executive-briefing/briefing-history.service";
import { recordBriefingDeliveryDraft } from "@/modules/executive-briefing/briefing-delivery.service";
import type { ExecutiveBriefingDeliveryChannel } from "@prisma/client";

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

  let channel: ExecutiveBriefingDeliveryChannel = "download";
  try {
    const body = (await request.json()) as { channel?: ExecutiveBriefingDeliveryChannel };
    if (body.channel) channel = body.channel;
  } catch {
    /* default */
  }

  const { deliveryId } = await recordBriefingDeliveryDraft({
    briefingId: id,
    channel,
    metadata: { draftOnly: true, noEmailSent: true },
  });

  await logBrokerWorkspaceEvent({
    actorUserId: session.userId,
    actionKey: brokerWorkspaceAuditKeys.founderBriefingDeliveryDraft,
    payload: { briefingId: id, channel, deliveryId },
  });

  return Response.json({ deliveryId, channel, note: "No email sent automatically in v1." });
}
