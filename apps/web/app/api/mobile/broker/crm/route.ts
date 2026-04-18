import { requireDailyActionCenterEnabled, requireMobileBrokerUser } from "@/lib/mobile/require-mobile-broker";
import { brokerCrmKpis, listBrokerCrmLeads } from "@/lib/broker-crm/list-leads";
import { logGrowthEngineAudit } from "@/modules/growth-engine-audit/growth-engine-audit.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireMobileBrokerUser(request);
  if (!auth.ok) return auth.response;
  const disabled = requireDailyActionCenterEnabled();
  if (disabled) return disabled;

  const [due, hot, kpis] = await Promise.all([
    listBrokerCrmLeads({ brokerUserId: auth.user.id, isAdmin: auth.isAdmin, filter: "followup_due", take: 25 }),
    listBrokerCrmLeads({ brokerUserId: auth.user.id, isAdmin: auth.isAdmin, filter: "high", take: 15 }),
    brokerCrmKpis(auth.user.id, auth.isAdmin),
  ]);

  await logGrowthEngineAudit({
    actorUserId: auth.user.id,
    action: "mobile_broker_crm_viewed",
    payload: {},
  });

  return Response.json({
    kind: "mobile_broker_crm_v1",
    followUpsDue: due,
    hotLeads: hot,
    kpis,
  });
}
