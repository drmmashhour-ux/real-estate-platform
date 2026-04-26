import { requireDailyActionCenterEnabled, requireMobileBrokerUser } from "@/lib/mobile/require-mobile-broker";
import { loadBrokerMobileSnoozed } from "@/lib/mobile/broker-mobile-preferences";
import { gatherDailyActionsForBroker } from "@/modules/daily-action-center/daily-action-center.service";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { DealExecutionType } from "@prisma/client";
import { trackMobileBrokerHomeViewed } from "@/lib/analytics/mobile-broker-analytics";
import { logGrowthEngineAudit } from "@/modules/growth-engine-audit/growth-engine-audit.service";

const RESIDENTIAL: DealExecutionType[] = [
  "residential_sale",
  "divided_coownership_sale",
  "undivided_coownership_sale",
  "residential_lease",
  "sale_brokerage",
  "purchase_brokerage",
  "amendment",
  "counter_proposal",
];

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

  const topActions = feed.all.slice(0, 5);

  const [activeDeals, unreadNotes] = await Promise.all([
    prisma.deal.count({
      where: {
        brokerId: auth.user.id,
        status: { not: "cancelled" },
        OR: [{ dealExecutionType: { in: RESIDENTIAL } }, { dealExecutionType: null }],
      },
    }),
    prisma.$queryRawUnsafe<{ c: number }[]>(
      `SELECT COUNT(*)::int AS c FROM notifications
       WHERE user_id = $1 AND status = 'UNREAD' AND metadata @> $2::jsonb`,
      auth.user.id,
      JSON.stringify({ brokerMobile: true })
    ).then((r) => Number(r[0]?.c ?? 0)),
  ]);

  trackMobileBrokerHomeViewed({ top: topActions.length });
  await logGrowthEngineAudit({
    actorUserId: auth.user.id,
    action: "mobile_broker_home_viewed",
    payload: { activeDeals },
  });

  return Response.json({
    kind: "mobile_broker_home_v1",
    topActions,
    stats: {
      activeResidentialDeals: activeDeals,
      unreadBrokerMobileNotifications: unreadNotes,
    },
    quickLinks: {
      approvals: "/broker/approvals",
      crm: "/broker/crm",
      deals: "/broker/deals",
    },
  });
}
