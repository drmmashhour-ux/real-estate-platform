import { requireDailyActionCenterEnabled, requireMobileBrokerUser } from "@/lib/mobile/require-mobile-broker";
import { snoozeMobileAction } from "@/modules/mobile-approvals/mobile-approval.service";
import { logGrowthEngineAudit } from "@/modules/growth-engine-audit/growth-engine-audit.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireMobileBrokerUser(request);
  if (!auth.ok) return auth.response;
  const disabled = requireDailyActionCenterEnabled();
  if (disabled) return disabled;

  const { id: raw } = await ctx.params;
  const actionId = decodeURIComponent(raw);

  let body: { until?: string };
  try {
    body = (await request.json()) as { until?: string };
  } catch {
    return Response.json({ error: "JSON body required" }, { status: 400 });
  }
  const until = typeof body.until === "string" ? Date.parse(body.until) : NaN;
  if (!Number.isFinite(until)) {
    return Response.json({ error: "until must be ISO date string" }, { status: 400 });
  }

  const r = await snoozeMobileAction({ userId: auth.user.id, actionId, until: new Date(until) });
  if (!r.ok) return Response.json({ error: r.error }, { status: 400 });

  await logGrowthEngineAudit({
    actorUserId: auth.user.id,
    action: "mobile_broker_action_snoozed",
    payload: { actionId, until: new Date(until).toISOString() },
  });

  return Response.json({ ok: true });
}
