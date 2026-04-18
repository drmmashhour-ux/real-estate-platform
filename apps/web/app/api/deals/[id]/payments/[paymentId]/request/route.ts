import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { requireTrustWorkflowV1 } from "@/lib/deals/payments-negotiation-feature-guard";
import { requestPayment } from "@/modules/payments-ops/lecipm-payments.service";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: Promise<{ id: string; paymentId: string }> }) {
  const gated = requireTrustWorkflowV1();
  if (gated) return gated;
  const { id: dealId, paymentId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  const r = await requestPayment({ dealId, paymentId, actorUserId: auth.userId });
  if (!r.ok) return Response.json({ error: r.message }, { status: 400 });
  return Response.json({ ok: true });
}
