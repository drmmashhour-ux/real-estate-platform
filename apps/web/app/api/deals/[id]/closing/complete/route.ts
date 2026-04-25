import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { canMutateExecution } from "@/lib/deals/execution-access";
import { requireClosingPipelineV1 } from "@/lib/deals/pipeline-feature-guard";
import { completeQuebecClosing } from "@/modules/quebec-closing/quebec-closing.service";

export const dynamic = "force-dynamic";

/**
 * Québec notarial completion: deed signed, land register state, optional keys release.
 * CRM `closed` + asset handoff only when land register is CONFIRMED or NOT_APPLICABLE (see service).
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const gated = requireClosingPipelineV1();
  if (gated) return gated;

  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;
  if (!canMutateExecution(auth.userId, auth.role, auth.deal)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const deedSignedAt = typeof body.deedSignedAt === "string" ? body.deedSignedAt : "";
  const landRegisterStatusRaw = typeof body.landRegisterStatus === "string" ? body.landRegisterStatus : "";
  const landRegisterStatus =
    landRegisterStatusRaw === "PENDING" || landRegisterStatusRaw === "CONFIRMED" || landRegisterStatusRaw === "NOT_APPLICABLE" ?
      landRegisterStatusRaw
    : null;

  if (!deedSignedAt || !landRegisterStatus) {
    return Response.json(
      { error: "deedSignedAt (ISO) and landRegisterStatus (PENDING|CONFIRMED|NOT_APPLICABLE) required" },
      { status: 400 },
    );
  }

  try {
    const bundle = await completeQuebecClosing({
      dealId,
      actorUserId: auth.userId,
      deedSignedAt,
      deedActNumber: typeof body.deedActNumber === "string" ? body.deedActNumber : body.deedActNumber === null ? null : undefined,
      deedPublicationReference:
        typeof body.deedPublicationReference === "string" ?
          body.deedPublicationReference
        : body.deedPublicationReference === null ? null : undefined,
      landRegisterStatus,
      landRegisterConfirmedAt:
        typeof body.landRegisterConfirmedAt === "string" ? body.landRegisterConfirmedAt : undefined,
      releaseKeys: body.releaseKeys === true,
      closingDate: typeof body.closingDate === "string" ? body.closingDate : body.closingDate === null ? null : undefined,
      notes: typeof body.notes === "string" ? body.notes : body.notes === null ? null : undefined,
    });
    return Response.json(bundle);
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
