import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { requireDealLedgerV1 } from "@/lib/deals/payments-negotiation-feature-guard";
import { listLedgerForDeal } from "@/modules/payments-ops/payment-ledger.service";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const gated = requireDealLedgerV1();
  if (gated) return gated;
  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;
  const entries = await listLedgerForDeal(dealId);
  return Response.json({ entries });
}
