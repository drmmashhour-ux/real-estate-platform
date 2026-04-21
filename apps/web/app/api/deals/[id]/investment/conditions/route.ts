import { NextRequest } from "next/server";
import { investmentPipelineConditionPost } from "@/modules/deals/deal-pipeline-route-delegates";

export const dynamic = "force-dynamic";

/**
 * Investment pipeline conditions (alias of `POST /api/deals/pipeline/[dealId]/conditions`).
 * Uses `/investment/conditions` because `POST /api/deals/[id]/conditions` is reserved for transactional deal conditions.
 */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return investmentPipelineConditionPost(request, id);
}
