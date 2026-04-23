import { prisma } from "@/lib/db";

export type CreateRecordRetentionInput = {
  entityType: string;
  entityId: string;
  ownerType: string;
  ownerId: string;
  retentionUntil?: Date | null;
  /** When true, record must not be updated in place except via controlled compliance APIs. */
  immutable?: boolean;
  legalHoldActive?: boolean;
  legalHoldReason?: string | null;
};

/**
 * Schedules retention / immutability / legal-hold mirror flags for an entity.
 * `immutableFrom` from policy docs is represented by `immutable: true` (effective immediately).
 */
export async function upsertRecordRetention(input: CreateRecordRetentionInput) {
  return prisma.recordRetention.upsert({
    where: {
      entityType_entityId: { entityType: input.entityType, entityId: input.entityId },
    },
    create: {
      ownerType: input.ownerType,
      ownerId: input.ownerId,
      entityType: input.entityType,
      entityId: input.entityId,
      retentionUntil: input.retentionUntil ?? null,
      immutable: input.immutable ?? false,
      legalHoldActive: input.legalHoldActive ?? false,
      legalHoldReason: input.legalHoldReason ?? null,
    },
    update: {
      retentionUntil: input.retentionUntil ?? undefined,
      immutable: input.immutable ?? undefined,
      legalHoldActive: input.legalHoldActive ?? undefined,
      legalHoldReason: input.legalHoldReason ?? undefined,
    },
  });
}

export async function getRecordRetention(entityType: string, entityId: string) {
  return prisma.recordRetention.findUnique({
    where: { entityType_entityId: { entityType, entityId } },
  });
}
