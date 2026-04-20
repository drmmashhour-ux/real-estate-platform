import { describe, expect, it } from "vitest";
import { deriveDocumentOutcomeRatio01, getEventSequencePatterns } from "../event-timeline.service";
import type { EventRecord } from "../event.types";

function row(p: Partial<EventRecord> & Pick<EventRecord, "id" | "eventType" | "createdAt">): EventRecord {
  return {
    entityType: p.entityType ?? "document",
    entityId: p.entityId ?? "d1",
    actorType: p.actorType ?? "seller",
    actorId: p.actorId ?? null,
    metadata: p.metadata ?? null,
    ...p,
  };
}

describe("event-timeline.service", () => {
  it("deriveDocumentOutcomeRatio01 returns null when too few outcomes", () => {
    expect(deriveDocumentOutcomeRatio01([])).toBe(null);
    const one = row({
      id: "1",
      eventType: "document_approved",
      createdAt: new Date(),
    });
    expect(deriveDocumentOutcomeRatio01([one])).toBe(null);
  });

  it("deriveDocumentOutcomeRatio01 is deterministic ratio", () => {
    const ev: EventRecord[] = [
      row({ id: "a", eventType: "document_approved", createdAt: new Date("2026-01-01T00:00:00Z") }),
      row({ id: "b", eventType: "document_rejected", createdAt: new Date("2026-01-02T00:00:00Z") }),
      row({ id: "c", eventType: "document_approved", createdAt: new Date("2026-01-03T00:00:00Z") }),
    ];
    expect(deriveDocumentOutcomeRatio01(ev)).toBe(2 / 3);
  });

  it("getEventSequencePatterns computes deltas", () => {
    const ev: EventRecord[] = [
      row({ id: "1", eventType: "document_submitted", createdAt: new Date("2026-01-01T00:00:00Z") }),
      row({ id: "2", eventType: "document_submitted", createdAt: new Date("2026-01-01T00:05:00Z") }),
    ];
    const p = getEventSequencePatterns(ev);
    expect(p.shortestDeltaMs).toBe(5 * 60 * 1000);
    expect(p.burstSegments).toBeGreaterThanOrEqual(0);
  });
});
