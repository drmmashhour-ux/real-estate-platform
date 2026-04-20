/**
 * Append-only event persistence — inserts only; no updates/deletes.
 */

import { prisma } from "@/lib/db";
import type { EventRecord, EventRecordInput } from "./event.types";

export type RecordEventResult = { ok: true; id: string } | { ok: false; error: string };

function validateInput(input: EventRecordInput): RecordEventResult | null {
  if (!input.entityType?.trim()) {
    return { ok: false, error: "entityType_required" };
  }
  if (!input.entityId?.trim()) {
    return { ok: false, error: "entityId_required" };
  }
  if (!input.eventType?.trim()) {
    return { ok: false, error: "eventType_required" };
  }
  if (!input.actorType?.trim()) {
    return { ok: false, error: "actorType_required" };
  }
  return null;
}

/**
 * Insert one timeline row. Does not throw — returns `{ ok: false }` on validation/DB errors.
 */
export async function recordEvent(input: EventRecordInput): Promise<RecordEventResult> {
  const ve = validateInput(input);
  if (ve) return ve;
  try {
    const row = await prisma.eventRecord.create({
      data: {
        entityType: input.entityType,
        entityId: input.entityId,
        eventType: input.eventType,
        actorId: input.actorId ?? null,
        actorType: input.actorType,
        metadata:
          input.metadata && typeof input.metadata === "object"
            ? (input.metadata as object)
            : undefined,
      },
    });
    return { ok: true, id: row.id };
  } catch {
    return { ok: false, error: "persist_failed" };
  }
}

export async function getEventsByEntity(
  entityType: EventRecord["entityType"],
  entityId: string,
): Promise<EventRecord[]> {
  if (!entityId.trim()) return [];
  try {
    const rows = await prisma.eventRecord.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: "asc" },
      take: 500,
    });
    return rows.map(mapRow);
  } catch {
    return [];
  }
}

export async function getEventsByActor(actorId: string): Promise<EventRecord[]> {
  if (!actorId.trim()) return [];
  try {
    const rows = await prisma.eventRecord.findMany({
      where: { actorId },
      orderBy: { createdAt: "desc" },
      take: 500,
    });
    return rows.map(mapRow);
  } catch {
    return [];
  }
}

export async function getRecentEvents(limit: number): Promise<EventRecord[]> {
  const take = Math.min(200, Math.max(1, Math.floor(limit)));
  try {
    const rows = await prisma.eventRecord.findMany({
      orderBy: { createdAt: "desc" },
      take,
    });
    return rows.map(mapRow);
  } catch {
    return [];
  }
}

function mapRow(row: {
  id: string;
  entityType: string;
  entityId: string;
  eventType: string;
  actorId: string | null;
  actorType: string;
  metadata: unknown;
  createdAt: Date;
}): EventRecord {
  return {
    id: row.id,
    entityType: row.entityType as EventRecord["entityType"],
    entityId: row.entityId,
    eventType: row.eventType as EventRecord["eventType"],
    actorId: row.actorId,
    actorType: row.actorType,
    metadata:
      row.metadata && typeof row.metadata === "object"
        ? (row.metadata as Record<string, unknown>)
        : null,
    createdAt: row.createdAt,
  };
}
