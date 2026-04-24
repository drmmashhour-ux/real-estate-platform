import type { LecipmExecutionPipelineState } from "@prisma/client";
import { prisma } from "@/lib/db";
import { asInputJsonValue } from "@/lib/prisma/as-input-json";
import { assertTrustAndExportGatesForDeal } from "@/lib/compliance/transaction-release-guards";
import { assertAutopilotOutboundAllowed } from "@/lib/signature-control/autopilot-guard";
import { assertHasBrokerApproval, assertTransitionAllowed, type ExecutionGuardContext } from "./execution-guard.service";
import { resolveBrokerApprovalUiState } from "@/modules/approval/broker-approval-workflow.service";
import { normalizeState } from "./execution-state-machine";
import type { ExecutionPipelineState, ExecutionTransitionReason } from "./execution.types";
import {
  DealConflictConsentBlockedError,
  assertDealConflictConsentAllowsProgress,
} from "@/lib/compliance/conflict-deal-compliance.service";

async function audit(
  dealId: string,
  actorUserId: string | null,
  actionKey: string,
  payload: Record<string, unknown>,
) {
  await prisma.dealExecutionAuditLog.create({
    data: { dealId, actorUserId, actionKey, payload: asInputJsonValue(payload) },
  });
}

export async function getExecutionStatus(dealId: string) {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: {
      id: true,
      lecipmExecutionPipelineState: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!deal) return null;
  const latestApproval = await prisma.dealExecutionApproval.findFirst({
    where: { dealId },
    orderBy: { approvedAt: "desc" },
    select: { id: true, approvedAt: true, approvedById: true },
  });
  const openConditions = await prisma.dealClosingCondition.count({
    where: { dealId, status: { notIn: ["fulfilled", "waived"] } },
  });
  const sig = await prisma.signatureSession.findFirst({
    where: { dealId },
    orderBy: { createdAt: "desc" },
    select: { id: true, status: true, provider: true },
  });
  const brokerUi = await resolveBrokerApprovalUiState(dealId);
  return {
    pipelineState: normalizeState(deal.lecipmExecutionPipelineState),
    dealStatus: deal.status,
    hasBrokerApproval: Boolean(latestApproval),
    latestApprovalAt: latestApproval?.approvedAt ?? null,
    openConditionsCount: openConditions,
    latestSignatureSession: sig,
    brokerApprovalUiState: brokerUi.uiState,
    brokerApprovalLabel: brokerUi.label,
    brokerApprovalId: brokerUi.brokerApprovalId,
    disclaimer:
      "LECIPM pipeline coordinates tasks — it does not replace OACIQ official publisher systems or broker-mandated execution.",
  };
}

export async function transitionPipelineState(input: {
  dealId: string;
  to: ExecutionPipelineState;
  actorUserId: string | null;
  reason: ExecutionTransitionReason;
  guard?: ExecutionGuardContext;
  /** When `LECIPM_AUTOPILOT_SIGNATURE_GATE` is on, closing the pipeline requires an EXECUTED action record. */
  actionPipelineId?: string | null;
}): Promise<{ ok: true; state: LecipmExecutionPipelineState } | { ok: false; message: string }> {
  const deal = await prisma.deal.findUnique({
    where: { id: input.dealId },
    select: { lecipmExecutionPipelineState: true },
  });
  if (!deal) return { ok: false, message: "Deal not found" };

  try {
    await assertDealConflictConsentAllowsProgress(input.dealId);
  } catch (e) {
    if (e instanceof DealConflictConsentBlockedError) {
      return { ok: false, message: e.message };
    }
    throw e;
  }

  if (input.to === "closed") {
    try {
      await assertAutopilotOutboundAllowed({
        operation: "execution_pipeline:close",
        actionPipelineId: input.actionPipelineId,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Signature gate blocked pipeline close.";
      return { ok: false, message: msg };
    }
  }

  const check = assertTransitionAllowed(deal.lecipmExecutionPipelineState, input.to);
  if (!check.ok) return check;

  const updated = await prisma.deal.update({
    where: { id: input.dealId },
    data: { lecipmExecutionPipelineState: input.to },
    select: { lecipmExecutionPipelineState: true },
  });

  await audit(input.dealId, input.actorUserId, "pipeline_state_transition", {
    to: input.to,
    reason: input.reason,
    guardOk: Boolean(input.guard),
  });

  return { ok: true, state: updated.lecipmExecutionPipelineState! };
}

export async function submitForBrokerReview(input: {
  dealId: string;
  actorUserId: string | null;
  ctx: ExecutionGuardContext;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const g = assertTransitionAllowed(
    (
      await prisma.deal.findUnique({
        where: { id: input.dealId },
        select: { lecipmExecutionPipelineState: true },
      })
    )?.lecipmExecutionPipelineState,
    "broker_review_required",
  );
  if (!g.ok) return g;
  const r = await transitionPipelineState({
    dealId: input.dealId,
    to: "broker_review_required",
    actorUserId: input.actorUserId,
    reason: "broker_submitted_for_review",
    guard: input.ctx,
  });
  return r.ok ? { ok: true } : r;
}

export async function startExecution(input: {
  dealId: string;
  actorUserId: string;
  ctx: ExecutionGuardContext;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const appr = await assertHasBrokerApproval(input.dealId);
  if (!appr.ok) return appr;

  if (process.env.LECIPM_REQUIRE_TRUST_RECONCILIATION_FOR_EXECUTION === "1") {
    const gate = await assertTrustAndExportGatesForDeal({
      dealId: input.dealId,
      requiresTrustReconciliation: true,
    });
    if (!gate.ok) return gate;
  }
  if (process.env.LECIPM_REQUIRE_REGULATOR_EXPORT_FOR_EXECUTION === "1") {
    const gate = await assertTrustAndExportGatesForDeal({
      dealId: input.dealId,
      requiresInspectionPacket: true,
    });
    if (!gate.ok) return gate;
  }

  const deal = await prisma.deal.findUnique({
    where: { id: input.dealId },
    select: { lecipmExecutionPipelineState: true },
  });
  const from = normalizeState(deal?.lecipmExecutionPipelineState);
  if (from !== "broker_approved" && from !== "ready_for_execution" && from !== "execution_in_progress") {
    return { ok: false, message: "Execution requires broker approval and valid pipeline state." };
  }

  const t = await transitionPipelineState({
    dealId: input.dealId,
    to: "execution_in_progress",
    actorUserId: input.actorUserId,
    reason: "execution_started",
    guard: input.ctx,
  });
  if (!t.ok) return t;
  return { ok: true };
}
