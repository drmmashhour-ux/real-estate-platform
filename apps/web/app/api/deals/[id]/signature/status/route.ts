import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { requireSignatureSystemV1 } from "@/lib/deals/pipeline-feature-guard";
import { getLatestSignatureSummary } from "@/modules/signature/signature.service";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const gated = requireSignatureSystemV1();
  if (gated) return gated;
  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  const summary = await getLatestSignatureSummary(dealId);
  return Response.json({ summary });
}
