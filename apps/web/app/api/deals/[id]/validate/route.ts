import { prisma } from "@repo/db";
import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { logContractEngineEvent } from "@/lib/contract-engine/events";
import { requireAiContractEngine } from "@/lib/contract-engine/guard";
import { aiContractEngineFlags } from "@/config/feature-flags";
import { runFullDealValidation } from "@/modules/validation/validation.service";
import { attachComplianceCopy } from "@/modules/validation/compliance-warning.service";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const blocked = requireAiContractEngine();
  if (blocked) return blocked;
  if (!aiContractEngineFlags.contractValidationV1) return Response.json({ error: "Validation disabled" }, { status: 403 });

  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  const deal = await prisma.deal.findUnique({ where: { id: dealId }, include: { dealParties: true } });
  if (!deal) return Response.json({ error: "Not found" }, { status: 404 });

  const { issues, disclaimer } = await runFullDealValidation(deal);
  void logContractEngineEvent("validation_run", auth.userId, dealId, { issueCount: issues.length });
  return Response.json({
    issues: attachComplianceCopy(issues),
    disclaimer,
    draftNotice: "Draft assistance — broker review required.",
  });
}
