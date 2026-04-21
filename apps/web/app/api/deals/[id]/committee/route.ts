import { investmentPipelineCommitteeSubmitPost } from "@/modules/deals/deal-pipeline-route-delegates";

export const dynamic = "force-dynamic";

/** Alias of `POST /api/deals/pipeline/[dealId]/committee/submit`. */
export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return investmentPipelineCommitteeSubmitPost(id);
}
