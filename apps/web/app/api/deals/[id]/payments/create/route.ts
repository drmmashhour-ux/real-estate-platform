import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { requireTrustWorkflowV1 } from "@/lib/deals/payments-negotiation-feature-guard";
import { buildCanonicalDealShape } from "@/modules/oaciq-mapper/source-paths/canonical-deal-shape";
import { loadDealForMapper } from "@/lib/oaciq/load-deal-for-mapper";
import { mapFormByKey } from "@/modules/oaciq-mapper/map-form-router";
import { createDepositPaymentFromPpMap } from "@/modules/payments-ops/integrations/pp-payment-mapper.service";
import { createDealPayment } from "@/modules/payments-ops/lecipm-payments.service";
import type { LecipmPaymentKind, LecipmTrustWorkflowMode } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const gated = requireTrustWorkflowV1();
  if (gated) return gated;
  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as {
    fromPpMap?: boolean;
    paymentKind?: LecipmPaymentKind;
    amountCents?: number;
    provider?: string;
    trustMode?: LecipmTrustWorkflowMode;
  };

  if (body.fromPpMap) {
    const deal = await loadDealForMapper(dealId);
    if (!deal) return Response.json({ error: "Deal not found" }, { status: 404 });
    const canonical = buildCanonicalDealShape(deal);
    const map = mapFormByKey("PP", canonical);
    const r = await createDepositPaymentFromPpMap({
      dealId,
      map,
      actorUserId: auth.userId,
      trustMode: body.trustMode,
    });
    if ("error" in r) return Response.json({ error: r.error }, { status: 400 });
    return Response.json(r);
  }

  if (!body.paymentKind || body.amountCents == null) {
    return Response.json({ error: "paymentKind and amountCents required (or fromPpMap: true)" }, { status: 400 });
  }

  const pay = await createDealPayment({
    dealId,
    paymentKind: body.paymentKind,
    amountCents: body.amountCents,
    provider: body.provider ?? "manual",
    actorUserId: auth.userId,
  });
  return Response.json({ payment: pay });
}
