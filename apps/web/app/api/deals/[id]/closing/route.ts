import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { requireClosingPipelineV1 } from "@/lib/deals/pipeline-feature-guard";
import { getQuebecClosingBundle } from "@/modules/quebec-closing/quebec-closing.service";

export const dynamic = "force-dynamic";

/** Québec closing-room bundle: stages, notary checklist, conditions, adjustments, packet index, gates. */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const gated = requireClosingPipelineV1();
  if (gated) return gated;

  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  try {
    const bundle = await getQuebecClosingBundle(dealId);
    return Response.json(bundle);
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
