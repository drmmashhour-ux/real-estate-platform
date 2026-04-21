import { NextRequest } from "next/server";
import { investmentPipelineDiligencePost } from "@/modules/deals/deal-pipeline-route-delegates";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: Promise<{ dealId: string }> }) {
  const { dealId } = await context.params;
  return investmentPipelineDiligencePost(request, dealId);
}
