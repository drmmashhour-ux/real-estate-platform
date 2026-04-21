import { NextRequest } from "next/server";
import { investmentPipelineConditionPost } from "@/modules/deals/deal-pipeline-route-delegates";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: Promise<{ dealId: string }> }) {
  const { dealId } = await context.params;
  return investmentPipelineConditionPost(request, dealId);
}
