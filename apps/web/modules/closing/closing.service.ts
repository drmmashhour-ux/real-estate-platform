import { prisma } from "@/lib/db";
import { transitionPipelineState } from "@/modules/execution/execution.service";
import type { ExecutionGuardContext } from "@/modules/execution/execution-guard.service";
import { assertClosingPreconditions } from "@/modules/execution/execution-guard.service";
import { normalizeState } from "@/modules/execution/execution-state-machine";
import { getClosingReadiness } from "./closing-readiness.service";
import { logClosingAnalytics } from "@/modules/analytics/signature-closing-analytics.service";

export async function confirmDealClosing(input: {
  dealId: string;
  actorUserId: string;
  ctx: ExecutionGuardContext;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const deal = await prisma.deal.findUnique({
    where: { id: input.dealId },
    select: { lecipmExecutionPipelineState: true },
  });
  if (!deal) return { ok: false, message: "Deal not found" };

  const state = normalizeState(deal.lecipmExecutionPipelineState);
  if (state !== "closing_ready") {
    return { ok: false, message: "Pipeline must be closing_ready before confirming closing." };
  }

  const readiness = await getClosingReadiness(input.dealId);
  if (!readiness.ready) {
    return { ok: false, message: "Closing readiness checks failed — see missingItems on closing-status." };
  }
  const sig = await prisma.signatureSession.findFirst({
    where: { dealId: input.dealId },
    orderBy: { createdAt: "desc" },
    include: { participants: true },
  });
  const signatureComplete = Boolean(
    sig &&
      sig.status === "completed" &&
      sig.participants.length > 0 &&
      sig.participants.every((p) => p.status === "signed"),
  );

  const open = await prisma.dealClosingCondition.count({
    where: { dealId: input.dealId, status: { not: "fulfilled" } },
  });

  const pre = assertClosingPreconditions({
    state,
    allConditionsFulfilled: open === 0,
    signatureComplete,
  });
  if (!pre.ok) return pre;

  const t = await transitionPipelineState({
    dealId: input.dealId,
    to: "closed",
    actorUserId: input.actorUserId,
    reason: "closing_confirmed",
    guard: input.ctx,
  });
  if (!t.ok) return t;

  await prisma.dealNotaryCoordination.updateMany({
    where: { dealId: input.dealId },
    data: { notaryInviteStatus: "completed", packageStatus: "completed" },
  });

  await logClosingAnalytics({ dealId: input.dealId, eventKey: "deal_closed", payload: { at: new Date().toISOString() } });

  return { ok: true };
}
