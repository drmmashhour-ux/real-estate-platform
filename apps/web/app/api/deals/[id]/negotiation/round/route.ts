import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { requireNegotiationCopilotV1 } from "@/lib/deals/payments-negotiation-feature-guard";
import { createNegotiationRound } from "@/modules/negotiation-copilot/negotiation.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const gated = requireNegotiationCopilotV1();
  if (gated) return gated;
  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as { initiatingParty?: string; summary?: Record<string, unknown> };
  if (!body.initiatingParty) return Response.json({ error: "initiatingParty required" }, { status: 400 });

  const round = await createNegotiationRound({
    dealId,
    initiatingParty: body.initiatingParty,
    summary: body.summary ?? {},
    actorUserId: auth.userId,
  });
  return Response.json({ round });
}
