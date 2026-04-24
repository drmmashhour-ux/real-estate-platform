import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { prisma } from "@repo/db";
import { lecipmOaciqFlags } from "@/config/feature-flags";
import { nextStep } from "@/modules/deal-execution/step-engine.service";
import type { ExecutionStepKey } from "@/modules/deal-execution/execution-orchestrator";
import { resolveCurrentStepFromDealStatus } from "@/modules/deal-execution/execution-orchestrator";
import {
  DealConflictConsentBlockedError,
  assertDealConflictConsentAllowsProgress,
} from "@/lib/compliance/conflict-deal-compliance.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/deals/[id]/step — advances assistive execution marker (stores hint in executionMetadata; broker-controlled).
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!lecipmOaciqFlags.residentialExecutionPipelineV1) {
    return Response.json({ error: "Residential execution pipeline disabled" }, { status: 403 });
  }

  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  let body: { advance?: boolean; currentStep?: ExecutionStepKey };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  const deal = await prisma.deal.findUnique({ where: { id: dealId } });
  if (!deal) return Response.json({ error: "Not found" }, { status: 404 });

  if (lecipmOaciqFlags.brokerConflictDisclosureV1) {
    try {
      await assertDealConflictConsentAllowsProgress(dealId);
    } catch (e) {
      if (e instanceof DealConflictConsentBlockedError) {
        return Response.json({ error: e.message, code: "CONFLICT_DISCLOSURE_REQUIRED" }, { status: 409 });
      }
      throw e;
    }
  }

  const meta =
    deal.executionMetadata && typeof deal.executionMetadata === "object"
      ? ({ ...(deal.executionMetadata as object) } as Record<string, unknown>)
      : {};

  const current =
    (meta.executionStep as ExecutionStepKey | undefined) ?? resolveCurrentStepFromDealStatus(deal.status);

  const target = body.advance ? nextStep(current) : body.currentStep ?? current;
  if (body.advance && !target) {
    return Response.json({ error: "Already at final step" }, { status: 400 });
  }

  meta.executionStep = target ?? current;
  meta.executionStepUpdatedAt = new Date().toISOString();
  meta.executionStepUpdatedBy = auth.userId;

  await prisma.deal.update({
    where: { id: dealId },
    data: { executionMetadata: meta as object },
  });

  return Response.json({ ok: true, executionStep: meta.executionStep });
}
