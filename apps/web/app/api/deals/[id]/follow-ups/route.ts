import { NextRequest } from "next/server";
import { investmentPipelineFollowUpPost } from "@/modules/deals/deal-pipeline-route-delegates";

export const dynamic = "force-dynamic";

/** Alias of `POST /api/deals/pipeline/[dealId]/followups`. */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return investmentPipelineFollowUpPost(request, id);
}
