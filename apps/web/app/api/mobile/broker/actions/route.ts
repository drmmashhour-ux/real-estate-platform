import { requireDailyActionCenterEnabled, requireMobileBrokerUser } from "@/lib/mobile/require-mobile-broker";
import { loadBrokerMobileSnoozed } from "@/lib/mobile/broker-mobile-preferences";
import { gatherDailyActionsForBroker } from "@/modules/daily-action-center/daily-action-center.service";
import { trackMobileActionCenterViewed } from "@/lib/analytics/mobile-broker-analytics";
import { logGrowthEngineAudit } from "@/modules/growth-engine-audit/growth-engine-audit.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireMobileBrokerUser(request);
  if (!auth.ok) return auth.response;
  const disabled = requireDailyActionCenterEnabled();
  if (disabled) return disabled;

  const snoozed = await loadBrokerMobileSnoozed(auth.user.id);
  const feed = await gatherDailyActionsForBroker({
    brokerUserId: auth.user.id,
    isAdmin: auth.isAdmin,
    snoozed,
  });

  trackMobileActionCenterViewed({ actionCount: feed.all.length });
  await logGrowthEngineAudit({
    actorUserId: auth.user.id,
    action: "mobile_broker_action_feed_read",
    payload: { count: feed.all.length },
  });

  return Response.json({ kind: "mobile_broker_actions_v1", feed });
}
