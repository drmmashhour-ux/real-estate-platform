import { NextRequest } from "next/server";
import { investmentPipelineCommitteeDecisionPost } from "@/modules/deals/deal-pipeline-route-delegates";

export const dynamic = "force-dynamic";

/** Alias of `POST /api/deals/pipeline/[dealId]/committee/decision`. */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return investmentPipelineCommitteeDecisionPost(request, id);
}
