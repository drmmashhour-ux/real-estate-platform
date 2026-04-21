import { NextRequest } from "next/server";
import { investmentPipelineStagePost } from "@/modules/deals/deal-pipeline-route-delegates";

export const dynamic = "force-dynamic";

/** Alias of `POST /api/deals/pipeline/[dealId]/stage` — same pipeline behavior. */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return investmentPipelineStagePost(request, id);
}
