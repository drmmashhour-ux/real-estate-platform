import { authenticateDealParticipantRoute } from "@/lib/deals/execution-access";
import { requireDealExecutionV1 } from "@/lib/deals/pipeline-feature-guard";
import { getExecutionStatus } from "@/modules/execution/execution.service";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const gated = requireDealExecutionV1();
  if (gated) return gated;
  const { id: dealId } = await context.params;
  const auth = await authenticateDealParticipantRoute(dealId);
  if (!auth.ok) return auth.response;

  const status = await getExecutionStatus(dealId);
  if (!status) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(status);
}
