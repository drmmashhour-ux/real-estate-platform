import { prisma } from "@repo/db";
import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { logContractEngineEvent } from "@/lib/contract-engine/events";
import { requireAiContractEngine } from "@/lib/contract-engine/guard";
import { aiContractEngineFlags } from "@/config/feature-flags";
import { runClauseEngine } from "@/modules/clause-engine/clause-engine.service";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const blocked = requireAiContractEngine();
  if (blocked) return blocked;
  if (!aiContractEngineFlags.clauseRetrievalV1) return Response.json({ error: "Clause retrieval disabled" }, { status: 403 });

  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  const deal = await prisma.deal.findUnique({ where: { id: dealId } });
  if (!deal) return Response.json({ error: "Not found" }, { status: 404 });

  const out = await runClauseEngine(deal);
  void logContractEngineEvent("suggestion_generated", auth.userId, dealId, { count: out.suggestions.length });
  return Response.json({ ...out, draftNotice: "Draft assistance — broker review required." });
}
