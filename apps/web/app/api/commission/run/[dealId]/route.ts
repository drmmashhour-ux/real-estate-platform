import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { brokerageOfficeFlags } from "@/config/feature-flags";
import { maybeTriggerCommissionCaseForDeal } from "@/lib/lecipm/commission-deal-trigger";

export const dynamic = "force-dynamic";

/** POST /api/commission/run/[dealId] — materialize commission case when office context + gross commission provided. */
export async function POST(request: Request, context: { params: Promise<{ dealId: string }> }) {
  if (!brokerageOfficeFlags.commissionEngineV1) {
    return Response.json({ error: "Commission engine disabled" }, { status: 403 });
  }

  const { dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  let body: { grossCommissionCents?: number };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }
  if (typeof body.grossCommissionCents !== "number") {
    return Response.json({ error: "grossCommissionCents required" }, { status: 400 });
  }

  const result = await maybeTriggerCommissionCaseForDeal({
    dealId,
    actorUserId: auth.userId,
    grossCommissionCents: Math.floor(body.grossCommissionCents),
    dealStatus: auth.deal.status,
  });

  if ("skipped" in result && result.skipped) {
    return Response.json(result, { status: 202 });
  }
  if ("ok" in result && result.ok === false && "error" in result) {
    return Response.json({ error: result.error }, { status: 400 });
  }
  return Response.json(result);
}
