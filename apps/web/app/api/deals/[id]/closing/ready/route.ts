import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { canMutateExecution } from "@/lib/deals/execution-access";
import { requireClosingPipelineV1 } from "@/lib/deals/pipeline-feature-guard";
import { markQuebecSigningReady } from "@/modules/quebec-closing/quebec-closing.service";

export const dynamic = "force-dynamic";

/** Move to SIGNING_READY when Québec gates pass (conditions, notary, packet, signatures). */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const gated = requireClosingPipelineV1();
  if (gated) return gated;

  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;
  if (!canMutateExecution(auth.userId, auth.role, auth.deal)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { signingAt?: string | null } = {};
  try {
    body = (await request.json()) as { signingAt?: string | null };
  } catch {
    body = {};
  }

  try {
    const bundle = await markQuebecSigningReady({
      dealId,
      actorUserId: auth.userId,
      signingAt: typeof body.signingAt === "string" ? body.signingAt : body.signingAt === null ? null : undefined,
    });
    return Response.json(bundle);
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
