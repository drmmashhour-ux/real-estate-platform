import { dealExecutionFlags } from "@/config/feature-flags";
import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { listLegalSourceCatalog, retrieveLegalContextForQuery, toStructuredChunks } from "@/modules/legal-knowledge/legal-knowledge.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  if (!dealExecutionFlags.draftingKnowledgeV1 && !dealExecutionFlags.contractIntelligenceV1) {
    return Response.json({ error: "Knowledge hooks disabled" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  const catalog = await listLegalSourceCatalog(30);
  const chunks = q ? toStructuredChunks(await retrieveLegalContextForQuery(q, { limit: 8 })) : [];

  return Response.json({
    catalog,
    chunks,
    disclaimer: "Source listings and retrieved excerpts are for broker review — verify against originals.",
  });
}
