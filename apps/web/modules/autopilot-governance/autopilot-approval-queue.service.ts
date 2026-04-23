/**
 * Maps `PlatformAutopilotAction` rows to operator queue items + admin transitions.
 */
import type { PlatformAutopilotActionStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export type ApprovalQueueUiStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED" | "EXECUTED";

export type ApprovalQueueItem = {
  id: string;
  /** Linked `LecipmFullAutopilotExecution` row when orchestrator created both. */
  executionId: string | null;
  domain: string;
  actionType: string;
  proposedPayload: unknown;
  explanation: string;
  riskLevel: string;
  suggestedBy: string;
  createdAt: string;
  expiresAt: string | null;
  status: ApprovalQueueUiStatus;
};

function mapPlatformStatus(s: PlatformAutopilotActionStatus): ApprovalQueueUiStatus {
  switch (s) {
    case "pending_approval":
      return "PENDING";
    case "approved":
      return "APPROVED";
    case "rejected":
      return "REJECTED";
    case "expired":
      return "EXPIRED";
    case "executed":
      return "EXECUTED";
    default:
      return "PENDING";
  }
}

export async function listApprovalQueue(params: { take?: number } = {}): Promise<ApprovalQueueItem[]> {
  const take = Math.min(params.take ?? 80, 200);
  const rows = await prisma.platformAutopilotAction.findMany({
    where: {
      status: { in: ["pending_approval", "approved", "executed", "rejected", "expired"] },
      entityType: "lecipm_full_autopilot",
    },
    orderBy: { createdAt: "desc" },
    take,
  });

  const execLinks = await prisma.lecipmFullAutopilotExecution.findMany({
    where: { platformActionId: { in: rows.map((r) => r.id) } },
    select: { id: true, platformActionId: true },
  });
  const execByPa = new Map(execLinks.map((e) => [e.platformActionId, e.id]));

  return rows.map((r) => {
    const reasons = (r.reasons ?? {}) as { suggestedBy?: string };
    return {
      id: r.id,
      executionId: execByPa.get(r.id) ?? null,
      domain: r.domain,
      actionType: r.actionType,
      proposedPayload: r.recommendedPayload ?? null,
      explanation: r.summary,
      riskLevel: r.riskLevel,
      suggestedBy: reasons.suggestedBy ?? r.subjectUserId ?? "system",
      createdAt: r.createdAt.toISOString(),
      expiresAt: null,
      status: mapPlatformStatus(r.status),
    };
  });
}

export async function approveQueuedPlatformAction(actionId: string, actorUserId: string): Promise<void> {
  const row = await prisma.platformAutopilotAction.findUnique({ where: { id: actionId } });
  if (!row || row.status !== "pending_approval") throw new Error("invalid_state");

  await prisma.platformAutopilotAction.update({
    where: { id: actionId },
    data: {
      status: "executed",
      approvedById: actorUserId,
      executedPayload:
        row.recommendedPayload && typeof row.recommendedPayload === "object" ?
          { ...(row.recommendedPayload as object), approvedExecute: true }
        : { approvedExecute: true },
      executedBySystem: false,
    },
  });

  await prisma.platformAutopilotDecision.create({
    data: {
      actionId,
      decisionType: "ADMIN_APPROVED_EXECUTE",
      actorUserId,
      actorType: "admin",
      notes: { via: "lecipm_full_autopilot_queue" } as object,
    },
  });
}

export async function rejectQueuedPlatformAction(actionId: string, actorUserId: string): Promise<void> {
  const row = await prisma.platformAutopilotAction.findUnique({ where: { id: actionId } });
  if (!row || row.status !== "pending_approval") throw new Error("invalid_state");

  await prisma.platformAutopilotAction.update({
    where: { id: actionId },
    data: { status: "rejected" },
  });

  await prisma.platformAutopilotDecision.create({
    data: {
      actionId,
      decisionType: "ADMIN_REJECTED",
      actorUserId,
      actorType: "admin",
      notes: {} as object,
    },
  });
}
