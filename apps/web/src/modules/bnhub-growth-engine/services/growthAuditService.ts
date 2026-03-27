import type { BnhubGrowthAuditActorType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function appendGrowthAuditLog(params: {
  actorType: BnhubGrowthAuditActorType;
  actorId?: string | null;
  entityType: string;
  entityId: string;
  actionType: string;
  actionSummary: string;
  beforeJson?: Prisma.InputJsonValue;
  afterJson?: Prisma.InputJsonValue;
}) {
  return prisma.bnhubGrowthAuditLog.create({
    data: {
      actorType: params.actorType,
      actorId: params.actorId,
      entityType: params.entityType,
      entityId: params.entityId,
      actionType: params.actionType,
      actionSummary: params.actionSummary,
      beforeJson: params.beforeJson,
      afterJson: params.afterJson,
    },
  });
}

export const logAction = appendGrowthAuditLog;

export async function logSystemAction(
  entityType: string,
  entityId: string,
  actionType: string,
  actionSummary: string,
  afterJson?: Prisma.InputJsonValue
) {
  return appendGrowthAuditLog({
    actorType: "SYSTEM",
    entityType,
    entityId,
    actionType,
    actionSummary,
    afterJson,
  });
}

export async function logConnectorAction(
  entityType: string,
  entityId: string,
  actionType: string,
  actionSummary: string,
  afterJson?: Prisma.InputJsonValue
) {
  return appendGrowthAuditLog({
    actorType: "CONNECTOR_WEBHOOK",
    entityType,
    entityId,
    actionType,
    actionSummary,
    afterJson,
  });
}

export async function logAIAction(
  entityType: string,
  entityId: string,
  actionType: string,
  actionSummary: string,
  afterJson?: Prisma.InputJsonValue
) {
  return appendGrowthAuditLog({
    actorType: "AI",
    entityType,
    entityId,
    actionType,
    actionSummary,
    afterJson,
  });
}
