import type { LecipmLegalBoundaryEntityType } from "@prisma/client";
import { resolveTransactionMode } from "./compliance-mode.engine";
import type { TransactionContext } from "./transaction-context.types";
import { prisma } from "@/lib/db";

function mapRow(r: {
  id: string;
  entityType: LecipmLegalBoundaryEntityType;
  entityId: string;
  mode: TransactionContext["mode"];
  brokerId: string | null;
  complianceState: TransactionContext["complianceState"];
  modeSource: TransactionContext["modeSource"];
  createdAt: Date;
  updatedAt: Date;
}): TransactionContext {
  return {
    id: r.id,
    entityType: r.entityType,
    entityId: r.entityId,
    mode: r.mode,
    brokerId: r.brokerId,
    complianceState: r.complianceState,
    modeSource: r.modeSource,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

/**
 * Returns persisted context, re-resolving from entities unless the row was upgraded via broker conversion.
 */
export async function getOrSyncTransactionContext(input: {
  entityType: LecipmLegalBoundaryEntityType;
  entityId: string;
}): Promise<TransactionContext> {
  const entityId = input.entityId.trim();
  const existing = await prisma.lecipmTransactionContext.findUnique({
    where: {
      entityType_entityId: { entityType: input.entityType, entityId },
    },
  });

  if (existing && existing.modeSource === "CONVERSION" && existing.mode === "BROKERED" && existing.brokerId) {
    return mapRow(existing);
  }

  const resolved = await resolveTransactionMode({ entityType: input.entityType, entityId });

  const row = await prisma.lecipmTransactionContext.upsert({
    where: { entityType_entityId: { entityType: input.entityType, entityId } },
    create: {
      entityType: input.entityType,
      entityId,
      mode: resolved.mode,
      brokerId: resolved.brokerId,
      complianceState: resolved.complianceState,
      modeSource: "AUTO",
    },
    update: {
      mode: resolved.mode,
      brokerId: resolved.brokerId,
      complianceState: resolved.complianceState,
      modeSource: "AUTO",
    },
  });

  return mapRow(row);
}

export async function getTransactionContextRow(input: {
  entityType: LecipmLegalBoundaryEntityType;
  entityId: string;
}): Promise<TransactionContext | null> {
  const entityId = input.entityId.trim();
  const row = await prisma.lecipmTransactionContext.findUnique({
    where: { entityType_entityId: { entityType: input.entityType, entityId } },
  });
  return row ? mapRow(row) : null;
}
