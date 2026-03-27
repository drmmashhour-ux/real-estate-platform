/**
 * Legal Defense and Liability Shield – policy acceptance, terms tracking, legal event logging.
 * Evidence-ready, immutable-style records for who accepted what, when, which version, which market.
 */
import { prisma } from "@/lib/db";

/** Record acceptance of a policy/terms (booking terms, payout terms, host responsibility, etc.). */
export async function recordPolicyAcceptance(params: {
  userId: string;
  policyKey: string;
  policyVersion: string;
  marketId?: string;
  entityType?: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: object;
}) {
  const record = await prisma.policyAcceptanceRecord.create({
    data: {
      userId: params.userId,
      policyKey: params.policyKey,
      policyVersion: params.policyVersion,
      marketId: params.marketId,
      entityType: params.entityType,
      entityId: params.entityId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: (params.metadata as object) ?? undefined,
    },
  });
  await prisma.legalEventLog.create({
    data: {
      eventType: "TERMS_ACCEPTED",
      userId: params.userId,
      entityType: params.entityType,
      entityId: params.entityId,
      marketId: params.marketId,
      payload: {
        policyKey: params.policyKey,
        policyVersion: params.policyVersion,
        recordId: record.id,
      },
    },
  });
  return record;
}

/** Check if user has accepted a policy (optionally for a specific version or market). */
export async function hasAcceptedPolicy(
  userId: string,
  policyKey: string,
  options?: { policyVersion?: string; marketId?: string }
) {
  const where: { userId: string; policyKey: string; policyVersion?: string; marketId?: string | null } = {
    userId,
    policyKey,
  };
  if (options?.policyVersion) where.policyVersion = options.policyVersion;
  if (options?.marketId !== undefined) where.marketId = options.marketId;
  const count = await prisma.policyAcceptanceRecord.count({ where });
  return count > 0;
}

/** Get acceptance records for a user (compliance review). */
export async function getAcceptanceRecordsForUser(userId: string, limit = 50) {
  return prisma.policyAcceptanceRecord.findMany({
    where: { userId },
    orderBy: { acceptedAt: "desc" },
    take: limit,
  });
}

/** Log a legal event (disclosure shown, jurisdiction binding, etc.). */
export async function logLegalEvent(params: {
  eventType: string;
  userId?: string;
  entityType?: string;
  entityId?: string;
  marketId?: string;
  payload?: object;
  reasonCode?: string;
}) {
  return prisma.legalEventLog.create({
    data: {
      eventType: params.eventType,
      userId: params.userId,
      entityType: params.entityType,
      entityId: params.entityId,
      marketId: params.marketId,
      payload: (params.payload as object) ?? undefined,
      reasonCode: params.reasonCode,
    },
  });
}

/** Get legal event log (admin/compliance). */
export async function getLegalEventLog(params: {
  eventType?: string;
  userId?: string;
  entityType?: string;
  entityId?: string;
  from?: Date;
  limit?: number;
}) {
  const where: Record<string, unknown> = {};
  if (params.eventType) where.eventType = params.eventType;
  if (params.userId) where.userId = params.userId;
  if (params.entityType) where.entityType = params.entityType;
  if (params.entityId) where.entityId = params.entityId;
  if (params.from) where.createdAt = { gte: params.from };
  return prisma.legalEventLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: params.limit ?? 100,
  });
}
