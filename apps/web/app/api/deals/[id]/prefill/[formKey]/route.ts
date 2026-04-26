import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { logContractEngineEvent } from "@/lib/contract-engine/events";
import { requireAiContractEngine } from "@/lib/contract-engine/guard";
import { aiContractEngineFlags } from "@/config/feature-flags";
import { runPrefillForForm } from "@/modules/prefill/prefill.service";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: Promise<{ id: string; formKey: string }> }) {
  const blocked = requireAiContractEngine();
  if (blocked) return blocked;
  if (!aiContractEngineFlags.dealPrefillV1) return Response.json({ error: "Prefill disabled" }, { status: 403 });

  const { id: dealId, formKey: rawKey } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: { dealParties: true },
  });
  if (!deal) return Response.json({ error: "Not found" }, { status: 404 });

  const formKey = decodeURIComponent(rawKey);
  const result = await runPrefillForForm(deal, formKey);
  if ("error" in result) return Response.json({ error: result.error }, { status: 400 });

  void logContractEngineEvent("prefill_run", auth.userId, dealId, { formKey });
  return Response.json(result);
}
