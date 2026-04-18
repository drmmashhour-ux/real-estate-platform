import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { requireTrustWorkflowV1 } from "@/lib/deals/payments-negotiation-feature-guard";
import { getTrustWorkflow, upsertTrustWorkflow } from "@/modules/payments-ops/lecipm-payments.service";
import { trustModeExplainer } from "@/modules/payments-ops/trust-policy.service";
import type { LecipmTrustWorkflowMode, LecipmTrustWorkflowStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const gated = requireTrustWorkflowV1();
  if (gated) return gated;
  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  const row = await getTrustWorkflow(dealId);
  const explainer = trustModeExplainer(row?.mode);
  return Response.json({ workflow: row, explainer });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const gated = requireTrustWorkflowV1();
  if (gated) return gated;
  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as {
    mode: LecipmTrustWorkflowMode;
    status?: LecipmTrustWorkflowStatus;
    trusteeName?: string | null;
    trusteeType?: string | null;
    trustAccountReference?: string | null;
  };
  if (!body.mode) return Response.json({ error: "mode required" }, { status: 400 });

  const row = await upsertTrustWorkflow({
    dealId,
    mode: body.mode,
    status: body.status,
    trusteeName: body.trusteeName,
    trusteeType: body.trusteeType,
    trustAccountReference: body.trustAccountReference,
    actorUserId: auth.userId,
  });
  return Response.json({ workflow: row, explainer: trustModeExplainer(row.mode) });
}
