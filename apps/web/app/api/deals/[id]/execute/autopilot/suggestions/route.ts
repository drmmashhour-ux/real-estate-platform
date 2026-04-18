import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { dealTransactionFlags } from "@/config/feature-flags";
import { runExecutionAutopilot } from "@/modules/autopilot/execution/execution-autopilot.service";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!dealTransactionFlags.executionAutopilotV1) {
    return Response.json({ error: "Execution autopilot disabled" }, { status: 403 });
  }
  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  const suggestions = await runExecutionAutopilot(dealId);
  return Response.json({ suggestions });
}
