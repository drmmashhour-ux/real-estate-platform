import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { requireTrustWorkflowV1 } from "@/lib/deals/payments-negotiation-feature-guard";
import { recordManualConfirmation } from "@/modules/payments-ops/payment-confirmation.service";
import type { LecipmPaymentConfirmationKind } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string; paymentId: string }> }) {
  const gated = requireTrustWorkflowV1();
  if (gated) return gated;
  const { id: dealId, paymentId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as {
    confirmationType?: LecipmPaymentConfirmationKind;
    evidence?: Record<string, unknown>;
  };
  if (!body.confirmationType) {
    return Response.json({ error: "confirmationType required" }, { status: 400 });
  }

  const r = await recordManualConfirmation({
    dealId,
    paymentId,
    confirmedById: auth.userId,
    confirmationType: body.confirmationType,
    evidence: body.evidence ?? { note: "broker_attested" },
  });
  if (!r.ok) return Response.json({ error: r.message }, { status: 400 });
  return Response.json({ ok: true });
}
