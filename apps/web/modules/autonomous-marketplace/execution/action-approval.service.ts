import { prisma } from "@/lib/db";
import { engineFlags } from "@/config/feature-flags";
import { classifyGovernanceOutcome } from "../feedback/governance-feedback-classifier.service";
import { buildGovernanceTrainingRow } from "../feedback/governance-training-data.service";
import { persistGovernanceFeedbackRecord } from "../feedback/governance-feedback.repository";
import type { GovernancePredictionSnapshot } from "../feedback/governance-feedback.types";
import type { GovernanceResolution, PolicyDecision } from "../types/domain.types";
import type { ProposedAction } from "../types/domain.types";
import { recordExecutionApproval } from "./execution-audit.service";

export type RequestActionApprovalParams = {
  runId: string;
  proposed: ProposedAction;
  policy: PolicyDecision;
  governance: GovernanceResolution;
  requestedByUserId: string | null;
};

export type RequestActionApprovalResult =
  | { ok: true; id: string; deduped?: boolean }
  | { ok: false; error: string };

/** Creates or returns an existing pending approval row (idempotent via idempotency key). Never throws. */
export async function requestActionApproval(params: RequestActionApprovalParams): Promise<RequestActionApprovalResult> {
  try {
    if (!engineFlags.autonomyApprovalsV1) {
      return { ok: false, error: "approvals_disabled" };
    }
    const key = `${params.runId}:${params.proposed.id}`;
    const existing = await prisma.autonomyPendingActionApproval.findUnique({
      where: { idempotencyKey: key },
    });
    if (existing) {
      return { ok: true, id: existing.id, deduped: true };
    }

    const row = await prisma.autonomyPendingActionApproval.create({
      data: {
        runId: params.runId,
        proposedActionId: params.proposed.id,
        proposedActionJson: params.proposed as unknown as object,
        policySnapshotJson: params.policy as unknown as object,
        governanceDisposition: params.governance.disposition,
        governanceReason: params.governance.reason,
        status: "pending",
        idempotencyKey: key,
        requestedByUserId: params.requestedByUserId ?? undefined,
      },
    });
    return { ok: true, id: row.id };
  } catch {
    return { ok: false, error: "approval_persist_failed" };
  }
}

export type ResolveApprovalParams = {
  approvalId: string;
  actorUserId: string;
};

type ApprovalRowSnapshot = {
  runId: string | null;
  proposedActionId: string;
  proposedActionJson: unknown;
  policySnapshotJson: unknown;
  governanceDisposition: string;
  governanceReason: string | null;
  requestedByUserId: string | null;
};

function buildGovernancePredictionFromApprovalRow(row: ApprovalRowSnapshot): GovernancePredictionSnapshot {
  const disp = String(row.governanceDisposition ?? "UNKNOWN");
  const blocked =
    disp === "REJECTED" ||
    disp === "BLOCKED_FOR_REGION" ||
    disp.includes("BLOCK");
  let policyDecision: string | undefined;
  if (row.policySnapshotJson && typeof row.policySnapshotJson === "object") {
    const pd = (row.policySnapshotJson as { disposition?: string }).disposition;
    if (typeof pd === "string") policyDecision = pd;
  }

  return {
    governanceDisposition: disp,
    blocked,
    requiresHumanApproval: true,
    allowExecution: disp === "AUTO_EXECUTE" && !blocked,
    policyDecision,
    legalRiskScore: 0,
    legalRiskLevel: "LOW",
    fraudRiskScore: 0,
    fraudRiskLevel: "LOW",
    combinedRiskScore: 0,
    combinedRiskLevel: "LOW",
    revenueImpactEstimate: 0,
    trace: [],
  };
}

function enqueueApprovalGovernanceFeedback(row: ApprovalRowSnapshot, approved: boolean): void {
  void (async () => {
    try {
      const now = new Date().toISOString();
      const prediction = buildGovernancePredictionFromApprovalRow(row);
      const proposed = row.proposedActionJson as ProposedAction | undefined;
      const meta =
        proposed?.metadata && typeof proposed.metadata === "object"
          ? (proposed.metadata as Record<string, unknown>)
          : {};
      const truthEvents = [
        {
          type: approved ? ("manual_approval_granted" as const) : ("manual_approval_rejected" as const),
          occurredAt: now,
        },
      ];
      const input = {
        runId: row.runId ?? undefined,
        actionType: proposed?.type,
        entityType: proposed?.target?.type,
        entityId: proposed?.target?.id ?? undefined,
        regionCode:
          typeof meta.platformRegionCode === "string"
            ? meta.platformRegionCode
            : typeof meta.regionCode === "string"
              ? meta.regionCode
              : undefined,
        userId: row.requestedByUserId ?? undefined,
        prediction,
        truthEvents,
      };
      const feedback = classifyGovernanceOutcome(input);
      const trainingRow = buildGovernanceTrainingRow({ input, result: feedback });
      await persistGovernanceFeedbackRecord({
        input,
        result: feedback,
        trainingRow: trainingRow as unknown as Record<string, unknown>,
      });
    } catch (e) {
      console.warn("[governance:feedback:approval]", e);
    }
  })();
}

export async function approvePendingAction(params: ResolveApprovalParams): Promise<{ ok: boolean; status?: string }> {
  try {
    const row = await prisma.autonomyPendingActionApproval.findUnique({ where: { id: params.approvalId } });
    if (!row) return { ok: false };
    if (row.status !== "pending") return { ok: true, status: row.status };

    await prisma.autonomyPendingActionApproval.update({
      where: { id: params.approvalId },
      data: {
        status: "approved",
        resolvedByUserId: params.actorUserId,
        resolvedAt: new Date(),
      },
    });
    await recordExecutionApproval({
      runId: row.runId,
      actionId: row.proposedActionId,
      approvalId: params.approvalId,
      resolution: "approved",
      actorUserId: params.actorUserId,
    });
    return { ok: true, status: "approved" };
  } catch {
    return { ok: false };
  }
}

export async function rejectPendingAction(params: ResolveApprovalParams & { reason?: string }): Promise<{
  ok: boolean;
  status?: string;
}> {
  try {
    const row = await prisma.autonomyPendingActionApproval.findUnique({
      where: { id: params.approvalId },
      select: {
        status: true,
        runId: true,
        proposedActionId: true,
        proposedActionJson: true,
        policySnapshotJson: true,
        governanceDisposition: true,
        governanceReason: true,
        requestedByUserId: true,
      },
    });
    if (!row) return { ok: false };
    if (row.status !== "pending") return { ok: true, status: row.status };

    await prisma.autonomyPendingActionApproval.update({
      where: { id: params.approvalId },
      data: {
        status: "rejected",
        resolvedByUserId: params.actorUserId,
        resolvedAt: new Date(),
        rejectionReason: params.reason,
      },
    });
    await recordExecutionApproval({
      runId: row.runId,
      actionId: row.proposedActionId,
      approvalId: params.approvalId,
      resolution: "rejected",
      actorUserId: params.actorUserId,
    });
    enqueueApprovalGovernanceFeedback(row, false);
    return { ok: true, status: "rejected" };
  } catch {
    return { ok: false };
  }
}

export async function listPendingApprovals(params: { take?: number }): Promise<{
  items: Array<{
    id: string;
    runId: string | null;
    proposedActionId: string;
    governanceDisposition: string;
    createdAt: Date;
  }>;
}> {
  const take = Math.min(params.take ?? 50, 200);
  try {
    const rows = await prisma.autonomyPendingActionApproval.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        runId: true,
        proposedActionId: true,
        governanceDisposition: true,
        createdAt: true,
      },
    });
    return { items: rows };
  } catch {
    return { items: [] };
  }
}
