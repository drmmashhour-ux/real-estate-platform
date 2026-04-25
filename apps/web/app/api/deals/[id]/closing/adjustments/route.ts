import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { canMutateExecution } from "@/lib/deals/execution-access";
import { requireClosingPipelineV1 } from "@/lib/deals/pipeline-feature-guard";
import { getQuebecClosingBundle, upsertClosingAdjustment } from "@/modules/quebec-closing/quebec-closing.service";
import type { DealClosingAdjustmentKind } from "@/modules/quebec-closing/quebec-closing.types";

export const dynamic = "force-dynamic";

const KINDS: DealClosingAdjustmentKind[] = [
  "MUNICIPAL_TAX",
  "SCHOOL_TAX",
  "CONDO_COMMON",
  "RENT_DEPOSIT",
  "PREPAID",
  "OCCUPANCY",
  "OTHER",
];

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

  const kind = typeof body.kind === "string" ? body.kind : "";
  if (!KINDS.includes(kind as DealClosingAdjustmentKind)) {
    return Response.json({ error: `kind must be one of: ${KINDS.join(", ")}` }, { status: 400 });
  }

  const label = typeof body.label === "string" ? body.label.trim() : "";
  if (!label) {
    return Response.json({ error: "label required" }, { status: 400 });
  }

  const amountCents = typeof body.amountCents === "number" && Number.isFinite(body.amountCents) ? Math.round(body.amountCents) : NaN;
  if (!Number.isFinite(amountCents)) {
    return Response.json({ error: "amountCents (integer cents) required" }, { status: 400 });
  }

  try {
    await upsertClosingAdjustment({
      dealId,
      actorUserId: auth.userId,
      id: typeof body.id === "string" ? body.id : undefined,
      kind: kind as DealClosingAdjustmentKind,
      label,
      amountCents,
      buyerOwes: body.buyerOwes === true,
      notes: typeof body.notes === "string" ? body.notes : body.notes === null ? null : undefined,
    });
    const bundle = await getQuebecClosingBundle(dealId);
    return Response.json(bundle);
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
