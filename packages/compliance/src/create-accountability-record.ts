import { prisma } from "@/lib/db";
import { logAuditEvent } from "@/lib/compliance/log-audit-event";

type CreateAccountabilityRecordInput = {
  ownerType: string;
  ownerId: string;
  entityType: string;
  entityId: string;
  actionKey: string;
  performedByActorId: string;
  accountableActorId: string;
  supervisorActorId?: string | null;
  delegated?: boolean;
  delegationId?: string | null;
  supervisionId?: string | null;
  approvalRequired?: boolean;
  approvalCompleted?: boolean;
  approvedByActorId?: string | null;
  /** When true, skip the secondary audit row for the accountability record (caller already logged the primary action). */
  skipAccountabilityAudit?: boolean;
};

export async function createAccountabilityRecord(input: CreateAccountabilityRecordInput) {
  const row = await prisma.accountabilityRecord.create({
    data: {
      ownerType: input.ownerType,
      ownerId: input.ownerId,
      entityType: input.entityType,
      entityId: input.entityId,
      actionKey: input.actionKey,
      performedByActorId: input.performedByActorId,
      accountableActorId: input.accountableActorId,
      supervisorActorId: input.supervisorActorId ?? null,
      delegated: input.delegated ?? false,
      delegationId: input.delegationId ?? null,
      supervisionId: input.supervisionId ?? null,
      approvalRequired: input.approvalRequired ?? false,
      approvalCompleted: input.approvalCompleted ?? false,
      approvedByActorId: input.approvedByActorId ?? null,
    },
  });

  await logAuditEvent({
    ownerType: input.ownerType,
    ownerId: input.ownerId,
    entityType: "accountability_record",
    entityId: row.id,
    actionType: "created",
    moduleKey: "general",
    actorId: input.performedByActorId,
    severity: "info",
    summary: `Accountability recorded for ${input.actionKey}`,
    details: {
      entityType: input.entityType,
      entityId: input.entityId,
      accountableActorId: input.accountableActorId,
      supervisorActorId: input.supervisorActorId ?? null,
      delegated: input.delegated ?? false,
    },
  });

  return row;
}
