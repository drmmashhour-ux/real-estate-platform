import type { LecipmExecutionPipelineState, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  OACIQ_ACK_TEXT_VERSION,
  OACIQ_BROKER_MANDATORY_ACK_TEXT,
} from "@/lib/approval/oaciq-broker-ack";
import { asInputJsonValue } from "@/lib/prisma/as-input-json";

export { OACIQ_ACK_TEXT_VERSION, OACIQ_BROKER_MANDATORY_ACK_TEXT };

export type BrokerApprovalUiState =
  | "none"
  | "pending_broker_approval"
  | "approved_signed"
  | "rejected"
  | "legacy_approved";

const INTEGRATION_MODULES = [
  "deals_pipeline",
  "document_engine",
  "esg_investment",
  "closing_workflow",
  "funds_allocation",
] as const;

async function audit(
  dealId: string,
  actorUserId: string | null,
  actionKey: string,
  payload: Record<string, unknown>,
) {
  await prisma.dealExecutionAuditLog.create({
    data: {
      dealId,
      actorUserId,
      actionKey,
      payload: asInputJsonValue(payload),
    },
  });
}

/** In-platform attestation row (manual provider) until external DocuSign/PandaDoc webhooks complete. */
async function createPlatformBrokerSignatureSession(
  tx: Prisma.TransactionClient,
  input: {
    dealId: string;
    brokerApprovalId: string;
    brokerUserId: string;
    brokerName: string;
    brokerEmail: string | null;
    channel: string;
  },
): Promise<{ sessionId: string }> {
  const session = await tx.signatureSession.create({
    data: {
      dealId: input.dealId,
      status: "completed",
      provider: "manual",
      providerMetadata: asInputJsonValue({
        attestation: "platform_broker_execution",
        brokerApprovalId: input.brokerApprovalId,
        brokerUserId: input.brokerUserId,
        channel: input.channel,
        workflowVersion: 2,
      }),
      documentIds: [],
      participants: {
        create: [
          {
            name: input.brokerName,
            role: "broker",
            email: input.brokerEmail,
            status: "signed",
            signedAt: new Date(),
          },
        ],
      },
    },
    select: { id: true },
  });
  return { sessionId: session.id };
}

export type FinalizeBrokerApprovalInput = {
  dealId: string;
  approvedById: string;
  notes?: string | null;
  snapshot?: Record<string, unknown>;
  oaciqBrokerAcknowledged: boolean;
  channel: string;
};

/**
 * Records an APPROVED broker workflow row, platform-attested signature session, and legacy DealExecutionApproval.
 * Throws if OACIQ acknowledgment is false.
 */
export async function finalizeBrokerApprovalWithSignature(
  input: FinalizeBrokerApprovalInput,
): Promise<{ brokerApprovalId: string; signatureSessionId: string; legacyApprovalId: string; approvedAt: Date }> {
  if (!input.oaciqBrokerAcknowledged) {
    throw new Error("OACIQ broker acknowledgment is required before approval.");
  }

  const broker = await prisma.user.findUnique({
    where: { id: input.approvedById },
    select: { id: true, name: true, email: true },
  });
  if (!broker) throw new Error("Approver not found.");

  const now = new Date();
  const beforeSnapshot = {
    ...(input.snapshot ?? {}),
    oaciqAckText: OACIQ_BROKER_MANDATORY_ACK_TEXT,
    oaciqAckVersion: OACIQ_ACK_TEXT_VERSION,
    channel: input.channel,
  };

  return prisma.$transaction(async (tx) => {
    const ba = await tx.brokerApproval.create({
      data: {
        dealId: input.dealId,
        status: "APPROVED",
        actionKey: input.channel,
        actionPayload: asInputJsonValue({ notes: input.notes ?? null }),
        beforeSnapshot: asInputJsonValue(beforeSnapshot),
        afterSnapshot: asInputJsonValue({
          integrationModules: [...INTEGRATION_MODULES],
          finalizedAt: now.toISOString(),
        }),
        requestedByUserId: input.approvedById,
        decidedByUserId: input.approvedById,
        decidedAt: now,
        oaciqAcknowledgedAt: now,
        oaciqAckTextVersion: OACIQ_ACK_TEXT_VERSION,
      },
    });

    const { sessionId } = await createPlatformBrokerSignatureSession(tx, {
      dealId: input.dealId,
      brokerApprovalId: ba.id,
      brokerUserId: input.approvedById,
      brokerName: broker.name?.trim() || broker.email || "Broker",
      brokerEmail: broker.email,
      channel: input.channel,
    });

    const updated = await tx.brokerApproval.update({
      where: { id: ba.id },
      data: { signatureSessionId: sessionId },
    });

    const legacy = await tx.dealExecutionApproval.create({
      data: {
        dealId: input.dealId,
        approvedById: input.approvedById,
        notes: input.notes ?? null,
        snapshot: asInputJsonValue({
          brokerApprovalId: updated.id,
          signatureSessionId: sessionId,
          oaciqAckVersion: OACIQ_ACK_TEXT_VERSION,
          ...beforeSnapshot,
        }) as object,
      },
    });

    await tx.deal.update({
      where: { id: input.dealId },
      data: { lecipmExecutionPipelineState: "broker_approved" satisfies LecipmExecutionPipelineState },
    });

    await tx.dealExecutionAuditLog.create({
      data: {
        dealId: input.dealId,
        actorUserId: input.approvedById,
        actionKey: "broker_approval_v2_finalized",
        payload: asInputJsonValue({
          brokerApprovalId: updated.id,
          signatureSessionId: sessionId,
          legacyDealExecutionApprovalId: legacy.id,
          beforeSnapshotKeys: Object.keys(beforeSnapshot),
          afterSnapshot: { integrationModules: INTEGRATION_MODULES },
        }),
      },
    });

    await tx.dealExecutionAuditLog.create({
      data: {
        dealId: input.dealId,
        actorUserId: input.approvedById,
        actionKey: "broker_execution_approval",
        payload: asInputJsonValue({
          approvalId: legacy.id,
          brokerApprovalId: updated.id,
          signatureSessionId: sessionId,
        }),
      },
    });

    return {
      brokerApprovalId: updated.id,
      signatureSessionId: sessionId,
      legacyApprovalId: legacy.id,
      approvedAt: now,
    };
  });
}

export async function createPendingBrokerApproval(input: {
  dealId: string;
  requestedByUserId: string;
  actionKey?: string;
  actionPayload?: Record<string, unknown>;
  beforeSnapshot?: Record<string, unknown>;
}): Promise<{ id: string }> {
  const row = await prisma.brokerApproval.create({
    data: {
      dealId: input.dealId,
      status: "PENDING",
      actionKey: input.actionKey ?? "execution_prep",
      actionPayload: asInputJsonValue(input.actionPayload ?? {}),
      beforeSnapshot: asInputJsonValue({
        ...(input.beforeSnapshot ?? {}),
        requestedAt: new Date().toISOString(),
      }),
      requestedByUserId: input.requestedByUserId,
    },
  });
  await audit(input.dealId, input.requestedByUserId, "broker_approval_request_created", {
    brokerApprovalId: row.id,
    actionKey: row.actionKey,
  });
  return { id: row.id };
}

export async function approvePendingBrokerApproval(input: {
  approvalId: string;
  brokerUserId: string;
  oaciqBrokerAcknowledged: boolean;
  afterSnapshot?: Record<string, unknown>;
}): Promise<{ brokerApprovalId: string; signatureSessionId: string }> {
  if (!input.oaciqBrokerAcknowledged) {
    throw new Error("OACIQ broker acknowledgment is required.");
  }

  const pending = await prisma.brokerApproval.findFirst({
    where: { id: input.approvalId, status: "PENDING" },
  });
  if (!pending) throw new Error("Pending approval not found.");

  const broker = await prisma.user.findUnique({
    where: { id: input.brokerUserId },
    select: { id: true, name: true, email: true },
  });
  if (!broker) throw new Error("Broker not found.");

  const now = new Date();
  const after = {
    ...(input.afterSnapshot ?? {}),
    integrationModules: [...INTEGRATION_MODULES],
    finalizedAt: now.toISOString(),
  };

  return prisma.$transaction(async (tx) => {
    const { sessionId } = await createPlatformBrokerSignatureSession(tx, {
      dealId: pending.dealId,
      brokerApprovalId: pending.id,
      brokerUserId: input.brokerUserId,
      brokerName: broker.name?.trim() || broker.email || "Broker",
      brokerEmail: broker.email,
      channel: pending.actionKey,
    });

    const updated = await tx.brokerApproval.update({
      where: { id: pending.id },
      data: {
        status: "APPROVED",
        decidedByUserId: input.brokerUserId,
        decidedAt: now,
        oaciqAcknowledgedAt: now,
        oaciqAckTextVersion: OACIQ_ACK_TEXT_VERSION,
        signatureSessionId: sessionId,
        afterSnapshot: asInputJsonValue(after),
      },
    });

    const legacy = await tx.dealExecutionApproval.create({
      data: {
        dealId: pending.dealId,
        approvedById: input.brokerUserId,
        notes: `Broker approval ${updated.id}`,
        snapshot: asInputJsonValue({
          brokerApprovalId: updated.id,
          signatureSessionId: sessionId,
        }) as object,
      },
    });

    await tx.dealExecutionAuditLog.create({
      data: {
        dealId: pending.dealId,
        actorUserId: input.brokerUserId,
        actionKey: "broker_execution_approval",
        payload: asInputJsonValue({
          approvalId: legacy.id,
          brokerApprovalId: updated.id,
          signatureSessionId: sessionId,
        }),
      },
    });

    await tx.deal.update({
      where: { id: pending.dealId },
      data: { lecipmExecutionPipelineState: "broker_approved" satisfies LecipmExecutionPipelineState },
    });

    await audit(pending.dealId, input.brokerUserId, "broker_approval_v2_approved", {
      brokerApprovalId: updated.id,
      signatureSessionId: sessionId,
    });

    return { brokerApprovalId: updated.id, signatureSessionId: sessionId };
  });
}

export async function rejectBrokerApproval(input: {
  approvalId: string;
  brokerUserId: string;
  reason: string;
}): Promise<void> {
  const row = await prisma.brokerApproval.findFirst({
    where: { id: input.approvalId, status: "PENDING" },
  });
  if (!row) throw new Error("Pending approval not found.");

  await prisma.brokerApproval.update({
    where: { id: row.id },
    data: {
      status: "REJECTED",
      decidedByUserId: input.brokerUserId,
      decidedAt: new Date(),
      rejectionReason: input.reason.slice(0, 4000),
    },
  });

  await audit(row.dealId, input.brokerUserId, "broker_approval_rejected", {
    brokerApprovalId: row.id,
    reason: input.reason.slice(0, 500),
  });
}

export async function listPendingBrokerApprovalsForUser(brokerUserId: string, isAdmin: boolean) {
  return prisma.brokerApproval.findMany({
    where: {
      status: "PENDING",
      ...(isAdmin ? {} : { deal: { brokerId: brokerUserId } }),
    },
    orderBy: { createdAt: "asc" },
    include: {
      deal: { select: { id: true, dealCode: true, status: true, brokerId: true } },
    },
    take: 100,
  });
}

export async function resolveBrokerApprovalUiState(dealId: string): Promise<{
  uiState: BrokerApprovalUiState;
  label: string;
  brokerApprovalId: string | null;
}> {
  const v2Count = await prisma.brokerApproval.count({ where: { dealId } });
  if (v2Count === 0) {
    const legacy = await prisma.dealExecutionApproval.findFirst({
      where: { dealId },
      orderBy: { approvedAt: "desc" },
    });
    if (legacy) {
      return {
        uiState: "legacy_approved",
        label: "Approved (legacy record — refresh approval for full traceability)",
        brokerApprovalId: null,
      };
    }
    return { uiState: "none", label: "Pending broker approval", brokerApprovalId: null };
  }

  const latest = await prisma.brokerApproval.findFirst({
    where: { dealId },
    orderBy: { createdAt: "desc" },
    include: { signatureSession: { select: { id: true, status: true } } },
  });
  if (!latest) {
    return { uiState: "none", label: "Pending broker approval", brokerApprovalId: null };
  }

  if (latest.status === "PENDING") {
    return {
      uiState: "pending_broker_approval",
      label: "Pending broker approval",
      brokerApprovalId: latest.id,
    };
  }
  if (latest.status === "REJECTED") {
    return {
      uiState: "rejected",
      label: "Rejected",
      brokerApprovalId: latest.id,
    };
  }

  if (latest.status === "APPROVED" && latest.signatureSessionId && latest.signatureSession) {
    const ok = latest.signatureSession.status === "completed";
    if (ok) {
      return {
        uiState: "approved_signed",
        label: "Approved & signed",
        brokerApprovalId: latest.id,
      };
    }
  }

  return {
    uiState: "pending_broker_approval",
    label: "Pending broker approval",
    brokerApprovalId: latest.id,
  };
}

/** Execution / start: requires APPROVED + completed platform or provider signature when v2 rows exist. */
export async function assertBrokerApprovalExecutionGate(
  dealId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const v2Count = await prisma.brokerApproval.count({ where: { dealId } });
  if (v2Count === 0) {
    const row = await prisma.dealExecutionApproval.findFirst({
      where: { dealId },
      orderBy: { approvedAt: "desc" },
    });
    if (!row) {
      return { ok: false, message: "Broker approval is required before execution steps." };
    }
    return { ok: true };
  }

  const approved = await prisma.brokerApproval.findFirst({
    where: { dealId, status: "APPROVED" },
    orderBy: { decidedAt: "desc" },
    include: { signatureSession: true },
  });

  if (!approved?.signatureSessionId || !approved.signatureSession) {
    return {
      ok: false,
      message: "Execution requires an approved broker attestation linked to a signature record.",
    };
  }

  const st = approved.signatureSession.status;
  if (st !== "completed") {
    return { ok: false, message: "Broker signature must be completed before execution proceeds." };
  }

  return { ok: true };
}
