import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { requireTrustWorkflowV1 } from "@/lib/deals/payments-negotiation-feature-guard";
import { prepareRefundDraft } from "@/modules/payment-automation/payment-automation.service";
import { transitionPaymentStatus } from "@/modules/payments-ops/payment-state-machine.service";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: Promise<{ id: string; paymentId: string }> }) {
  const gated = requireTrustWorkflowV1();
  if (gated) return gated;
  const { id: dealId, paymentId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  const draft = await prepareRefundDraft(dealId, paymentId, auth.userId);
  if (!draft.ready) {
    return Response.json({ ok: false, refundReadiness: draft }, { status: 400 });
  }

  const t = await transitionPaymentStatus({
    paymentId,
    dealId,
    to: "refund_pending",
    actorUserId: auth.userId,
    ledgerDescription: "Refund workflow drafted — external settlement still required",
  });
  if (!t.ok) return Response.json({ error: t.message, refundReadiness: draft }, { status: 400 });
  return Response.json({ ok: true, refundReadiness: draft });
}
