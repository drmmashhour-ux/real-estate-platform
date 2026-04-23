import { prisma } from "@repo/db";
import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { requireAiContractEngine } from "@/lib/contract-engine/guard";
import { aiContractEngineFlags } from "@/config/feature-flags";
import { validateFormKeyDependencies } from "@/modules/validation/dependency-validation.service";
import { runFullDealValidation } from "@/modules/validation/validation.service";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: Promise<{ id: string; formKey: string }> }) {
  const blocked = requireAiContractEngine();
  if (blocked) return blocked;
  if (!aiContractEngineFlags.contractValidationV1) return Response.json({ error: "Validation disabled" }, { status: 403 });

  const { id: dealId, formKey: rawKey } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  const deal = await prisma.deal.findUnique({ where: { id: dealId }, include: { dealParties: true } });
  if (!deal) return Response.json({ error: "Not found" }, { status: 404 });

  const formKey = decodeURIComponent(rawKey);
  const dep = validateFormKeyDependencies(deal, formKey);
  const full = await runFullDealValidation(deal);

  return Response.json({
    formKey,
    dependencyHints: dep,
    issues: full.issues,
    disclaimer: full.disclaimer,
  });
}
