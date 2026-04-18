import { dealExecutionFlags } from "@/config/feature-flags";
import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { logDraftingAudit } from "@/lib/deals/drafting-audit";
import { prisma } from "@/lib/db";
import { runComplianceForDealDrafting } from "@/modules/drafting-ai/compliance-checker";

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

  const compliance = await runComplianceForDealDrafting(deal);

  await logDraftingAudit({
    dealId,
    actorUserId: auth.userId,
    actionKey: "drafting_check",
    payload: { issueCount: compliance.issues.length },
  });

  return Response.json(compliance);
}
