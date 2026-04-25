/**
 * AI Operations – central queue of items for AI review and decision.
 * Never auto-deletes data; block/flag only. All decisions audited in ai_logs.
 */
import { prisma } from "@/lib/db";

export type QueueItemType = "listing" | "booking" | "user" | "dispute";
export type QueueItemStatus = "pending" | "flagged" | "approved" | "rejected";
export type RecommendedAction = "approve" | "flag" | "block" | "review";

export type AiQueueItemRecord = {
  id: string;
  type: QueueItemType;
  entityId: string;
  riskScore: number | null;
  trustScore: number | null;
  status: QueueItemStatus;
  recommendedAction: RecommendedAction | null;
  details: unknown;
  createdAt: Date;
  updatedAt: Date;
};

/** Add an item to the queue. Idempotent per (type, entityId) if status is pending. */
export async function enqueueItem(
  type: QueueItemType,
  entityId: string,
  options?: { riskScore?: number; trustScore?: number; recommendedAction?: RecommendedAction }
): Promise<AiQueueItemRecord> {
  const existing = await prisma.aiQueueItem.findFirst({
    where: { type, entityId, status: "pending" },
  });
  if (existing) {
    return {
      id: existing.id,
      type: existing.type as QueueItemType,
      entityId: existing.entityId,
      riskScore: existing.riskScore,
      trustScore: existing.trustScore != null ? Number(existing.trustScore) : null,
      status: existing.status as QueueItemStatus,
      recommendedAction: (existing.recommendedAction as RecommendedAction) ?? null,
      details: existing.details,
      createdAt: existing.createdAt,
      updatedAt: existing.updatedAt,
    };
  }
  const row = await prisma.aiQueueItem.create({
    data: {
      type,
      entityId,
      riskScore: options?.riskScore ?? undefined,
      trustScore: options?.trustScore ?? undefined,
      recommendedAction: options?.recommendedAction ?? undefined,
    },
  });
  return {
    id: row.id,
    type: row.type as QueueItemType,
    entityId: row.entityId,
    riskScore: row.riskScore,
    trustScore: row.trustScore != null ? Number(row.trustScore) : null,
    status: row.status as QueueItemStatus,
    recommendedAction: (row.recommendedAction as RecommendedAction) ?? null,
    details: row.details,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/** Get queue items, optionally filtered by status or type. */
export async function getQueueItems(params?: {
  status?: QueueItemStatus;
  type?: QueueItemType;
  limit?: number;
  offset?: number;
}): Promise<AiQueueItemRecord[]> {
  const where: { status?: string; type?: string } = {};
  if (params?.status) where.status = params.status;
  if (params?.type) where.type = params.type;
  const limit = Math.min(100, Math.max(1, params?.limit ?? 50));
  const offset = Math.max(0, params?.offset ?? 0);

  const items = await prisma.aiQueueItem.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });

  return items.map((row) => ({
    id: row.id,
    type: row.type as QueueItemType,
    entityId: row.entityId,
    riskScore: row.riskScore,
    trustScore: row.trustScore != null ? Number(row.trustScore) : null,
    status: row.status as QueueItemStatus,
    recommendedAction: (row.recommendedAction as RecommendedAction) ?? null,
    details: row.details,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

/** Update queue item status (and optionally recommendedAction, details, riskScore, trustScore). */
export async function updateQueueStatus(
  id: string,
  status: QueueItemStatus,
  options?: {
    recommendedAction?: RecommendedAction;
    details?: Record<string, unknown>;
    riskScore?: number;
    trustScore?: number;
  }
): Promise<AiQueueItemRecord | null> {
  const row = await prisma.aiQueueItem.updateMany({
    where: { id },
    data: {
      status,
      ...(options?.recommendedAction != null && { recommendedAction: options.recommendedAction }),
      ...(options?.details != null && { details: options.details as object }),
      ...(options?.riskScore != null && { riskScore: options.riskScore }),
      ...(options?.trustScore != null && { trustScore: options.trustScore }),
    },
  });
  if (row.count === 0) return null;
  const updated = await prisma.aiQueueItem.findUnique({ where: { id } });
  if (!updated) return null;
  return {
    id: updated.id,
    type: updated.type as QueueItemType,
    entityId: updated.entityId,
    riskScore: updated.riskScore,
    trustScore: updated.trustScore != null ? Number(updated.trustScore) : null,
    status: updated.status as QueueItemStatus,
    recommendedAction: (updated.recommendedAction as RecommendedAction) ?? null,
    details: updated.details,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  };
}

/** Get a single queue item by id. */
export async function getQueueItem(id: string): Promise<AiQueueItemRecord | null> {
  const row = await prisma.aiQueueItem.findUnique({ where: { id } });
  if (!row) return null;
  return {
    id: row.id,
    type: row.type as QueueItemType,
    entityId: row.entityId,
    riskScore: row.riskScore,
    trustScore: row.trustScore != null ? Number(row.trustScore) : null,
    status: row.status as QueueItemStatus,
    recommendedAction: (row.recommendedAction as RecommendedAction) ?? null,
    details: row.details,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
