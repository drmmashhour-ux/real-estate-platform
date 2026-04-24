import type { TransactionEntityType, TransactionMode } from "./transaction-context.types";
import { prisma } from "@/lib/db";

export async function writeLegalBoundaryAudit(input: {
  actionType: string;
  entityId: string;
  entityType?: TransactionEntityType | null;
  mode: TransactionMode;
  allowed: boolean;
  reason: string;
  actorUserId?: string | null;
}): Promise<void> {
  await prisma.lecipmLegalBoundaryAuditLog.create({
    data: {
      actionType: input.actionType,
      entityId: input.entityId,
      entityType: input.entityType ?? null,
      mode: input.mode,
      allowed: input.allowed,
      reason: input.reason,
      actorUserId: input.actorUserId ?? null,
    },
  });
}

export async function writeSignatureBoundaryAudit(input: {
  entityId: string;
  entityType?: TransactionEntityType | null;
  mode: TransactionMode;
  detail: string;
  actorUserId?: string | null;
}): Promise<void> {
  await writeLegalBoundaryAudit({
    actionType: "signature_event",
    entityId: input.entityId,
    entityType: input.entityType ?? null,
    mode: input.mode,
    allowed: true,
    reason: input.detail,
    actorUserId: input.actorUserId,
  });
}
