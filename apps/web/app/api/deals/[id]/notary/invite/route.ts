import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { requireNotarySystemV1 } from "@/lib/deals/pipeline-feature-guard";
import { inviteNotaryToDeal } from "@/modules/notary/notary-invitation.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const gated = requireNotarySystemV1();
  if (gated) return gated;
  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as { notaryId?: string };
  if (!body.notaryId) {
    return Response.json({ error: "notaryId required" }, { status: 400 });
  }

  const r = await inviteNotaryToDeal({ dealId, notaryId: body.notaryId, actorUserId: auth.userId });
  if (!r.ok) return Response.json({ error: r.message }, { status: 400 });
  return Response.json({ ok: true });
}
