import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { lecipmOaciqFlags } from "@/config/feature-flags";
import { runOaciqDocumentComplianceForDeal } from "@/modules/oaciq-compliance/oaciq-deal-compliance.service";

export const dynamic = "force-dynamic";

/** GET /api/compliance/deal/[dealId] — runs OACIQ document checklist scan; may open ComplianceCase. */
export async function GET(_req: Request, context: { params: Promise<{ dealId: string }> }) {
  if (!lecipmOaciqFlags.oaciqFormsEngineV1) {
    return Response.json({ error: "OACIQ compliance bridge disabled" }, { status: 403 });
  }

  const { dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  const result = await runOaciqDocumentComplianceForDeal(dealId);
  return Response.json(result);
}
