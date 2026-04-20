/**
 * Read-only timeline assembly — no inference / scoring here.
 */

import type { EventRecord } from "./event.types";
import { getEventsByActor, getEventsByEntity } from "./event.service";

export type EntityTimelineResult = {
  events: EventRecord[];
  byType: Record<string, number>;
  orderedIds: string[];
};

export async function buildEntityTimeline(
  entityType: EventRecord["entityType"],
  entityId: string,
): Promise<EntityTimelineResult> {
  const events = await getEventsByEntity(entityType, entityId);
  return summarizeTimeline(events);
}

export async function buildActorTimeline(actorId: string): Promise<EntityTimelineResult> {
  const events = await getEventsByActor(actorId);
  return summarizeTimeline(events);
}

function summarizeTimeline(events: EventRecord[]): EntityTimelineResult {
  const byType: Record<string, number> = {};
  for (const e of events) {
    byType[e.eventType] = (byType[e.eventType] ?? 0) + 1;
  }
  const ordered = [...events].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  return {
    events: ordered,
    byType,
    orderedIds: ordered.map((e) => e.id),
  };
}

export type EventSequencePatterns = {
  medianDeltaMsBetweenEvents: number | null;
  shortestDeltaMs: number | null;
  burstSegments: number;
};

/**
 * Lightweight spacing stats for anomaly detectors — deterministic only.
 */
export function getEventSequencePatterns(events: EventRecord[]): EventSequencePatterns {
  if (events.length < 2) {
    return { medianDeltaMsBetweenEvents: null, shortestDeltaMs: null, burstSegments: 0 };
  }
  const sorted = [...events].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const deltas: number[] = [];
  let burstSegments = 0;
  const burstThresholdMs = 15 * 60 * 1000;
  for (let i = 1; i < sorted.length; i++) {
    const d = sorted[i]!.createdAt.getTime() - sorted[i - 1]!.createdAt.getTime();
    if (d >= 0) {
      deltas.push(d);
      if (d < burstThresholdMs) burstSegments += 1;
    }
  }
  if (deltas.length === 0) {
    return { medianDeltaMsBetweenEvents: null, shortestDeltaMs: null, burstSegments: 0 };
  }
  deltas.sort((a, b) => a - b);
  const mid = Math.floor(deltas.length / 2);
  const median =
    deltas.length % 2 === 1 ? deltas[mid]! : Math.round((deltas[mid - 1]! + deltas[mid]!) / 2);
  return {
    medianDeltaMsBetweenEvents: median,
    shortestDeltaMs: deltas[0] ?? null,
    burstSegments,
  };
}

/** Derive a 0–1 ratio of approvals vs rejections from document outcome events (deterministic). */
export function deriveDocumentOutcomeRatio01(events: EventRecord[]): number | null {
  let a = 0;
  let r = 0;
  for (const e of events) {
    if (e.eventType === "document_approved") a++;
    if (e.eventType === "document_rejected") r++;
  }
  const t = a + r;
  if (t < 2) return null;
  return a / t;
}
