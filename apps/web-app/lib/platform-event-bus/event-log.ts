/**
 * Event log – persist and query platform events.
 */

import { prisma } from "@/lib/db";
import type { ProcessingStatus } from "./types";
import type { StoredPlatformEvent } from "./types";

export async function appendEvent(params: {
  eventType: string;
  sourceModule: string;
  entityType?: string | null;
  entityId?: string | null;
  payload?: unknown;
  region?: string | null;
}): Promise<StoredPlatformEvent> {
  const row = await prisma.platformEvent.create({
    data: {
      eventType: params.eventType,
      sourceModule: params.sourceModule,
      entityType: params.entityType ?? undefined,
      entityId: params.entityId ?? undefined,
      payload: params.payload ?? undefined,
      region: params.region ?? undefined,
      processingStatus: "pending",
    },
  });
  return toStoredEvent(row);
}

export async function getEventById(eventId: string): Promise<StoredPlatformEvent | null> {
  const row = await prisma.platformEvent.findUnique({
    where: { id: eventId },
  });
  return row ? toStoredEvent(row) : null;
}

export async function updateProcessingStatus(
  eventId: string,
  status: ProcessingStatus,
  errorMessage?: string | null
): Promise<void> {
  await prisma.platformEvent.update({
    where: { id: eventId },
    data: {
      processingStatus: status,
      processedAt: status === "processed" ? new Date() : undefined,
      errorMessage: errorMessage ?? undefined,
    },
  });
}

export async function listEvents(params?: {
  eventType?: string;
  sourceModule?: string;
  processingStatus?: string;
  entityType?: string;
  entityId?: string;
  since?: Date;
  limit?: number;
}): Promise<StoredPlatformEvent[]> {
  const rows = await prisma.platformEvent.findMany({
    where: {
      ...(params?.eventType && { eventType: params.eventType }),
      ...(params?.sourceModule && { sourceModule: params.sourceModule }),
      ...(params?.processingStatus && { processingStatus: params.processingStatus }),
      ...(params?.entityType && { entityType: params.entityType }),
      ...(params?.entityId && { entityId: params.entityId }),
      ...(params?.since && { createdAt: { gte: params.since } }),
    },
    orderBy: { createdAt: "desc" },
    take: params?.limit ?? 100,
  });
  return rows.map(toStoredEvent);
}

export async function getPendingEvents(limit = 50): Promise<StoredPlatformEvent[]> {
  return listEvents({ processingStatus: "pending", limit });
}

function toStoredEvent(row: {
  id: string;
  eventType: string;
  sourceModule: string;
  entityType: string | null;
  entityId: string | null;
  payload: unknown;
  region: string | null;
  processingStatus: string;
  processedAt: Date | null;
  errorMessage: string | null;
  createdAt: Date;
}): StoredPlatformEvent {
  return {
    id: row.id,
    eventType: row.eventType,
    sourceModule: row.sourceModule,
    entityType: row.entityType,
    entityId: row.entityId,
    payload: row.payload,
    region: row.region,
    processingStatus: row.processingStatus,
    processedAt: row.processedAt,
    errorMessage: row.errorMessage,
    createdAt: row.createdAt,
  };
}
