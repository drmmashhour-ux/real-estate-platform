import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { requireSignatureSystemV1 } from "@/lib/deals/pipeline-feature-guard";
import { sendSignatureSession } from "@/modules/signature/signature.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const gated = requireSignatureSystemV1();
  if (gated) return gated;
  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as { sessionId?: string };
  if (!body.sessionId) {
    return Response.json({ error: "sessionId required" }, { status: 400 });
  }
  const result = await sendSignatureSession(body.sessionId, dealId);
  if (!result.ok) {
    return Response.json({ error: result.message }, { status: 400 });
  }
  return Response.json(result);
}
