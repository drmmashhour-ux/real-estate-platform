import { prisma } from "@/lib/db";

export class RetentionEnforcementError extends Error {
  readonly code: string;

  constructor(code: string) {
    super(code);
    this.name = "RetentionEnforcementError";
    this.code = code;
  }
}

export async function getRecordRetention(entityType: string, entityId: string) {
  return prisma.recordRetention.findUnique({
    where: {
      entityType_entityId: { entityType, entityId },
    },
  });
}

/**
 * Throws if an active legal hold applies (row flag and/or active `LegalHold` rows).
 */
export async function assertNoActiveLegalHold(input: {
  ownerType: string;
  ownerId: string;
  entityType: string;
  entityId: string;
}) {
  const row = await getRecordRetention(input.entityType, input.entityId);
  if (row?.legalHoldActive) {
    throw new RetentionEnforcementError("LEGAL_HOLD_ACTIVE");
  }

  const hold = await prisma.legalHold.findFirst({
    where: {
      active: true,
      OR: [
        {
          appliesGlobally: true,
          ownerType: input.ownerType,
          ownerId: input.ownerId,
        },
        {
          entityType: input.entityType,
          entityId: input.entityId,
        },
      ],
    },
  });

  if (hold) {
    throw new RetentionEnforcementError("LEGAL_HOLD_ACTIVE");
  }
}

export async function assertRetentionAllowsDelete(entityType: string, entityId: string) {
  const row = await getRecordRetention(entityType, entityId);
  if (!row?.retentionUntil) return;
  if (row.retentionUntil.getTime() > Date.now()) {
    throw new RetentionEnforcementError("RETENTION_NOT_EXPIRED");
  }
}

export async function assertRecordMutable(entityType: string, entityId: string) {
  const row = await getRecordRetention(entityType, entityId);
  if (row?.immutable) {
    throw new RetentionEnforcementError("RECORD_IMMUTABLE");
  }
}

/** Convenience: delete path — retention window + legal hold. */
export async function assertMayDeleteRecord(input: {
  ownerType: string;
  ownerId: string;
  entityType: string;
  entityId: string;
}) {
  await assertNoActiveLegalHold(input);
  await assertRetentionAllowsDelete(input.entityType, input.entityId);
}

/** Logs a destruction event (uses privacy destruction log table; job optional). */
export async function logComplianceRecordDestruction(input: {
  entityType: string;
  entityId: string;
  destroyedBy: string;
  destructionMethod: string;
  jobId?: string | null;
}) {
  return prisma.privacyDestructionLog.create({
    data: {
      jobId: input.jobId ?? null,
      entityType: input.entityType,
      entityId: input.entityId,
      destroyedBy: input.destroyedBy,
      destructionMethod: input.destructionMethod,
    },
  });
}
