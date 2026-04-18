import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { requireOaciqExecutionBridge, requireOaciqFormMapper } from "@/lib/oaciq/guard";
import { createBridgeSession } from "@/modules/execution-bridge/execution-bridge.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const bridgeBlocked = requireOaciqExecutionBridge();
  if (bridgeBlocked) return bridgeBlocked;
  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  let formKey = "PP";
  try {
    const body = (await request.json()) as { formKey?: string };
    if (body.formKey) formKey = body.formKey;
  } catch {
    /* default */
  }

  const mapperBlocked = requireOaciqFormMapper(formKey);
  if (mapperBlocked) return mapperBlocked;

  const session = await createBridgeSession({ dealId, formKey, actorUserId: auth.userId });

  return Response.json({
    ...session,
    officialIntegrationConnected: false,
    message:
      "Session is draft-only — official broker-authorized form environment is not connected. Use manual transfer when approved.",
  });
}
