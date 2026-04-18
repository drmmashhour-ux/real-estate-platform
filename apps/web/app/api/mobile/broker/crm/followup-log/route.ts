import { requireDailyActionCenterEnabled, requireMobileBrokerUser } from "@/lib/mobile/require-mobile-broker";
import { prisma } from "@/lib/db";
import { trackMobileFollowUpLogged } from "@/lib/analytics/mobile-broker-analytics";
import { logGrowthEngineAudit } from "@/modules/growth-engine-audit/growth-engine-audit.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireMobileBrokerUser(request);
  if (!auth.ok) return auth.response;
  const disabled = requireDailyActionCenterEnabled();
  if (disabled) return disabled;

  const body = await request.json().catch(() => ({}));
  const leadId = typeof body?.leadId === "string" ? body.leadId : "";
  const note = typeof body?.note === "string" ? body.note.slice(0, 2000) : "";
  const nextFollowUpAt =
    typeof body?.nextFollowUpAt === "string" ? Date.parse(body.nextFollowUpAt) : NaN;

  if (!leadId) {
    return Response.json({ error: "leadId required" }, { status: 400 });
  }

  const lead = await prisma.lecipmBrokerCrmLead.findFirst({
    where: auth.isAdmin ? { id: leadId } : { id: leadId, brokerUserId: auth.user.id },
  });
  if (!lead) {
    return Response.json({ error: "Lead not found" }, { status: 404 });
  }

  const nextDate = Number.isFinite(nextFollowUpAt) ? new Date(nextFollowUpAt) : null;

  await prisma.lecipmBrokerCrmLead.update({
    where: { id: leadId },
    data: {
      lastContactAt: new Date(),
      ...(nextDate ? { nextFollowUpAt: nextDate } : {}),
    },
  });

  await prisma.lecipmBrokerCrmAuditLog.create({
    data: {
      brokerId: auth.user.id,
      actionKey: "mobile_followup_log",
      payload: { leadId, note, source: "mobile_broker" },
    },
  });

  trackMobileFollowUpLogged({ leadId });
  await logGrowthEngineAudit({
    actorUserId: auth.user.id,
    action: "mobile_broker_followup_logged",
    payload: { leadId },
  });

  return Response.json({ ok: true });
}
