import { dealExecutionFlags } from "@/config/feature-flags";
import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { logDraftingAudit } from "@/lib/deals/drafting-audit";
import { prisma } from "@/lib/db";
import { buildFieldPrefillProposal } from "@/modules/drafting-ai/field-prefill-engine";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  if (!dealExecutionFlags.contractIntelligenceV1) {
    return Response.json({ error: "Drafting intelligence disabled" }, { status: 403 });
  }

  const deal = await prisma.deal.findUnique({ where: { id: dealId } });
  if (!deal) return Response.json({ error: "Not found" }, { status: 404 });

  const fieldPrefill = buildFieldPrefillProposal(deal);

  await logDraftingAudit({
    dealId,
    actorUserId: auth.userId,
    actionKey: "drafting_prefill",
    payload: { fieldCount: fieldPrefill.length },
  });

  return Response.json({ fieldPrefill, disclaimer: "Draft – Broker Review Required for every field mapping." });
}
