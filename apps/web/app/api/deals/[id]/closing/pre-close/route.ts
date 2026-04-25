import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { canMutateExecution } from "@/lib/deals/execution-access";
import { requireClosingPipelineV1 } from "@/lib/deals/pipeline-feature-guard";
import { attestPreClosingIdentities } from "@/modules/quebec-closing/quebec-closing.service";

export const dynamic = "force-dynamic";

/** Broker attestation: identities verified for notarial pre-closing. */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const gated = requireClosingPipelineV1();
  if (gated) return gated;

  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;
  if (!canMutateExecution(auth.userId, auth.role, auth.deal)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { identitiesVerified?: boolean } = {};
  try {
    body = (await request.json()) as { identitiesVerified?: boolean };
  } catch {
    body = {};
  }

  if (body.identitiesVerified !== true) {
    return Response.json({ error: "identitiesVerified: true required" }, { status: 400 });
  }

  try {
    const bundle = await attestPreClosingIdentities({
      dealId,
      actorUserId: auth.userId,
      role: auth.role,
    });
    return Response.json(bundle);
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
