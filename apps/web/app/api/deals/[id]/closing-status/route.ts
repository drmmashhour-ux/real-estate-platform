import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { requireClosingPipelineV1 } from "@/lib/deals/pipeline-feature-guard";
import { getClosingReadiness } from "@/modules/closing/closing-readiness.service";
import { getClosingTimeline } from "@/modules/closing/closing-timeline.service";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const gated = requireClosingPipelineV1();
  if (gated) return gated;
  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  const [readiness, timeline] = await Promise.all([getClosingReadiness(dealId), getClosingTimeline(dealId)]);

  return Response.json({ readiness, timeline });
}
