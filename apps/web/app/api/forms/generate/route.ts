import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { prisma } from "@repo/db";
import { lecipmOaciqFlags } from "@/config/feature-flags";
import { generateStructuredContractFieldsForForm } from "@/modules/ai-contract/ai-contract-generator";
import { assertBrokeredTransaction } from "@/modules/legal-boundary/compliance-action-guard";
import { getOrSyncTransactionContext } from "@/modules/legal-boundary/transaction-context.service";

export const dynamic = "force-dynamic";

/** POST /api/forms/generate — strict structured field proposal for a deal (no free-text instrument). */
export async function POST(request: Request) {
  if (!lecipmOaciqFlags.aiContractMapperV1) {
    return Response.json({ error: "AI contract mapper disabled" }, { status: 403 });
  }

  let body: { dealId?: string; formKey?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.dealId || !body.formKey) {
    return Response.json({ error: "dealId and formKey required" }, { status: 400 });
  }

  const auth = await authenticateBrokerDealRoute(body.dealId);
  if (!auth.ok) return auth.response;

  const deal = await prisma.deal.findUnique({ where: { id: body.dealId } });
  if (!deal) return Response.json({ error: "Not found" }, { status: 404 });

  const txCtx = await getOrSyncTransactionContext({ entityType: "DEAL", entityId: body.dealId });
  const boundaryBlock = await assertBrokeredTransaction(txCtx, "contract_field_generation", auth.userId, {
    auditAllowSuccess: true,
  });
  if (boundaryBlock) return boundaryBlock;

  const payload = generateStructuredContractFieldsForForm(body.formKey.toUpperCase(), deal);
  return Response.json(payload);
}
