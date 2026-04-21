import { investmentPipelineCommitteeSubmitPost } from "@/modules/deals/deal-pipeline-route-delegates";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: Promise<{ dealId: string }> }) {
  const { dealId } = await context.params;
  return investmentPipelineCommitteeSubmitPost(dealId);
}
