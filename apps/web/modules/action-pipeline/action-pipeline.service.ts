import { createHash } from "node:crypto";
import type { ActionPipelineStatus, ActionPipelineType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  AUTOPILOT_ACTION_PIPELINE_ACK_TEXT,
  SIGNATURE_CONTROL_EVENTS,
} from "@/lib/signature-control/autopilot-broker-ack";
import { asInputJsonValue } from "@/lib/prisma/as-input-json";
import { runActionPipelineExecutionHooks } from "./action-pipeline-execution.service";

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((v) => stableStringify(v)).join(",")}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => JSON.stringify(k) + ":" + stableStringify(obj[k])).join(",")}}`;
}

function documentHashForAction(input: { id: string; type: ActionPipelineType; dataJson: unknown }): string {
  const payload = stableStringify({ id: input.id, type: input.type, data: input.dataJson });
  return createHash("sha256").update(payload, "utf8").digest("hex");
}

async function writeAudit(
  tx: Prisma.TransactionClient,
  input: {
    actionPipelineId: string;
    dealId: string | null;
    eventKey: string;
    payload: Record<string, unknown>;
    actorUserId: string | null;
  },
) {
  await tx.signatureControlAuditLog.create({
    data: {
      actionPipelineId: input.actionPipelineId,
      dealId: input.dealId,
      eventKey: input.eventKey,
      payload: asInputJsonValue(input.payload),
      actorUserId: input.actorUserId,
    },
  });
}

export async function createActionPipelineRecord(input: {
  type: ActionPipelineType;
  dataJson: Record<string, unknown>;
  dealId?: string | null;
  aiGenerated?: boolean;
  initialStatus: "DRAFT" | "READY_FOR_SIGNATURE";
  actorUserId: string | null;
}): Promise<{ id: string }> {
  return prisma.$transaction(async (tx) => {
    const row = await tx.actionPipeline.create({
      data: {
        type: input.type,
        dataJson: asInputJsonValue(input.dataJson),
        aiGenerated: input.aiGenerated ?? true,
        status: input.initialStatus,
        dealId: input.dealId ?? null,
      },
    });
    await writeAudit(tx, {
      actionPipelineId: row.id,
      dealId: row.dealId,
      eventKey: SIGNATURE_CONTROL_EVENTS.actionCreated,
      payload: { type: input.type, status: row.status, aiGenerated: row.aiGenerated },
      actorUserId: input.actorUserId,
    });
    if (input.initialStatus === "READY_FOR_SIGNATURE") {
      await writeAudit(tx, {
        actionPipelineId: row.id,
        dealId: row.dealId,
        eventKey: SIGNATURE_CONTROL_EVENTS.readyForSignature,
        payload: { type: input.type },
        actorUserId: input.actorUserId,
      });
    }
    return { id: row.id };
  });
}

export async function markActionPipelineReadyForSignature(input: {
  actionId: string;
  actorUserId: string | null;
}): Promise<void> {
  const row = await prisma.actionPipeline.findUnique({
    where: { id: input.actionId },
    select: { id: true, status: true, dealId: true, type: true },
  });
  if (!row) throw new Error("Action pipeline not found.");
  if (row.status !== "DRAFT") {
    throw new Error("Only DRAFT actions can move to READY_FOR_SIGNATURE.");
  }
  await prisma.$transaction(async (tx) => {
    await tx.actionPipeline.update({
      where: { id: row.id },
      data: { status: "READY_FOR_SIGNATURE" satisfies ActionPipelineStatus },
    });
    await writeAudit(tx, {
      actionPipelineId: row.id,
      dealId: row.dealId,
      eventKey: SIGNATURE_CONTROL_EVENTS.readyForSignature,
      payload: { type: row.type },
      actorUserId: input.actorUserId,
    });
  });
}

export async function brokerSignAndExecuteActionPipeline(input: {
  actionId: string;
  brokerUserId: string;
  isAdmin: boolean;
  agreementConfirmed: boolean;
  agreementText: string;
  ipAddress: string | null;
  userAgent: string | null;
}): Promise<{ actionId: string; signatureId: string }> {
  if (!input.agreementConfirmed || input.agreementText !== AUTOPILOT_ACTION_PIPELINE_ACK_TEXT) {
    throw new Error("Broker agreement confirmation is required with the exact mandated text.");
  }

  const action = await prisma.actionPipeline.findUnique({
    where: { id: input.actionId },
    include: { brokerSignature: true, deal: { select: { brokerId: true } } },
  });
  if (!action) throw new Error("Action pipeline not found.");
  if (action.brokerSignature) throw new Error("Action already signed.");
  if (action.status !== "READY_FOR_SIGNATURE") {
    throw new Error("Action must be READY_FOR_SIGNATURE before broker signature.");
  }
  if (action.dealId) {
    if (!action.deal?.brokerId) {
      if (!input.isAdmin) {
        throw new Error("Deal has no assigned broker — only admin may sign this action.");
      }
    } else if (!input.isAdmin && action.deal.brokerId !== input.brokerUserId) {
      throw new Error("Only the assigned broker may sign this action.");
    }
  } else if (!input.isAdmin) {
    throw new Error("Global autopilot actions require admin to sign.");
  }

  const hash = documentHashForAction({
    id: action.id,
    type: action.type,
    dataJson: action.dataJson,
  });

  return prisma.$transaction(async (tx) => {
    const sig = await tx.brokerSignature.create({
      data: {
        brokerId: input.brokerUserId,
        actionId: action.id,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent?.slice(0, 500) ?? null,
        documentHash: hash,
      },
    });

    await tx.actionPipeline.update({
      where: { id: action.id },
      data: { status: "SIGNED" satisfies ActionPipelineStatus },
    });

    await writeAudit(tx, {
      actionPipelineId: action.id,
      dealId: action.dealId,
      eventKey: SIGNATURE_CONTROL_EVENTS.signed,
      payload: { signatureId: sig.id, documentHash: hash },
      actorUserId: input.brokerUserId,
    });

    const hooks = await runActionPipelineExecutionHooks({
      actionId: action.id,
      type: action.type,
      dealId: action.dealId,
      dataJson: action.dataJson,
    });

    await tx.actionPipeline.update({
      where: { id: action.id },
      data: { status: "EXECUTED" satisfies ActionPipelineStatus },
    });

    await writeAudit(tx, {
      actionPipelineId: action.id,
      dealId: action.dealId,
      eventKey: SIGNATURE_CONTROL_EVENTS.executed,
      payload: { hooks: hooks.hooksRun },
      actorUserId: input.brokerUserId,
    });

    if (action.dealId) {
      await tx.dealExecutionAuditLog
        .create({
          data: {
            dealId: action.dealId,
            actorUserId: input.brokerUserId,
            actionKey: "signature_control.executed",
            payload: asInputJsonValue({
              actionPipelineId: action.id,
              type: action.type,
              signatureId: sig.id,
            }),
          },
        })
        .catch(() => undefined);
    }

    return { actionId: action.id, signatureId: sig.id };
  });
}

export async function getActionPipelineForBroker(actionId: string, brokerUserId: string, isAdmin: boolean) {
  const row = await prisma.actionPipeline.findUnique({
    where: { id: actionId },
    include: { brokerSignature: true, deal: { select: { id: true, brokerId: true, dealCode: true, priceCents: true } } },
  });
  if (!row) return null;
  if (isAdmin) return row;
  if (row.dealId) {
    if (!row.deal?.brokerId) return null;
    if (row.deal.brokerId !== brokerUserId) return null;
    return row;
  }
  return null;
}

export async function listActionPipelinesForDeal(dealId: string, brokerUserId: string, isAdmin: boolean) {
  if (!isAdmin) {
    const deal = await prisma.deal.findFirst({
      where: { id: dealId, brokerId: brokerUserId },
      select: { id: true },
    });
    if (!deal) return [];
  }
  return prisma.actionPipeline.findMany({
    where: { dealId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { brokerSignature: { select: { id: true, signedAt: true, documentHash: true } } },
  });
}
