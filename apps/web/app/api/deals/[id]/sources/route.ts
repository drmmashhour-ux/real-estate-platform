import { prisma } from "@/lib/db";
import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { requireAiContractEngine } from "@/lib/contract-engine/guard";
import { listRegisteredForms } from "@/modules/form-engine/form-registry.service";
import { retrieveHybrid } from "@/modules/legal-knowledge/legal-retrieval.service";
import { buildDraftingQueryFromDeal } from "@/modules/deal-intelligence/drafting-context.builder";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const blocked = requireAiContractEngine();
  if (blocked) return blocked;

  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: { dealParties: { select: { id: true } } },
  });
  if (!deal) return Response.json({ error: "Not found" }, { status: 404 });

  const q = new URL(request.url).searchParams.get("q")?.trim();
  const query = q ?? buildDraftingQueryFromDeal(deal);
  const registry = listRegisteredForms().map((f) => ({ formKey: f.formKey, formCode: f.formCode, title: f.title }));
  const chunks = query.length >= 3 ? await retrieveHybrid(query, { limit: 8 }) : [];

  return Response.json({ registry, retrieval: chunks, draftNotice: "Draft assistance — broker review required." });
}
