import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { requireOaciqExecutionBridge } from "@/lib/oaciq/guard";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const bridgeBlocked = requireOaciqExecutionBridge();
  if (bridgeBlocked) return bridgeBlocked;
  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  return Response.json({
    dealId,
    executionReadinessStatus: "draft_only" as const,
    officialBrokerAuthorizedProvider: "not_connected" as const,
    message:
      "Official publisher / broker-authorized execution channel is not connected. Status remains draft-only or manual transfer.",
    specimenDisclaimer: "Specimen-based mapping layer — separate from operative execution.",
  });
}
