import { prisma } from "@/lib/db";
import type { RecordRetention } from "@prisma/client";

/**
 * Blocks mutating/destructive operations when an active `LegalHold` or mirrored `RecordRetention.legalHoldActive` applies.
 */
export async function assertNoActiveLegalHold(input: {
  ownerType: string;
  ownerId: string;
  entityType?: string;
  entityId?: string;
}): Promise<void> {
  const entityClause =
    input.entityType && input.entityId
      ? {
          OR: [
            { appliesGlobally: true },
            { entityType: input.entityType, entityId: input.entityId },
          ],
        }
      : { appliesGlobally: true };

  const hold = await prisma.legalHold.findFirst({
    where: {
      ownerType: input.ownerType,
      ownerId: input.ownerId,
      active: true,
      ...entityClause,
    },
  });
  if (hold) {
    throw new Error("LEGAL_HOLD_ACTIVE");
  }

  if (input.entityType && input.entityId) {
    const retention = await prisma.recordRetention.findUnique({
      where: { entityType_entityId: { entityType: input.entityType, entityId: input.entityId } },
    });
    if (retention?.legalHoldActive) {
      throw new Error("LEGAL_HOLD_ACTIVE");
    }
  }
}

export function assertRetentionExpiredForDelete(
  retention: Pick<RecordRetention, "retentionUntil"> | null,
  now: Date = new Date(),
): void {
  if (!retention?.retentionUntil) return;
  if (retention.retentionUntil.getTime() > now.getTime()) {
    throw new Error("RETENTION_NOT_EXPIRED");
  }
}

export function assertRecordNotImmutable(retention: Pick<RecordRetention, "immutable"> | null): void {
  if (retention?.immutable) {
    throw new Error("RECORD_IMMUTABLE");
  }
}

/** Standard soft-delete payload — never hard-delete compliance-bound entities. */
export function complianceSoftDeleteFields() {
  return { deletedAt: new Date() };
}
