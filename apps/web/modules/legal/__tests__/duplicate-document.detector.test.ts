import { describe, expect, it } from "vitest";
import { duplicateDocumentDetector } from "../detectors/duplicate-document.detector";
import type { LegalIntelligenceSnapshot } from "../legal-intelligence.types";

function baseSnapshot(over: Partial<LegalIntelligenceSnapshot> = {}): LegalIntelligenceSnapshot {
  const now = "2026-04-01T12:00:00.000Z";
  return {
    builtAt: now,
    windowStart: "2026-03-01T12:00:00.000Z",
    windowEnd: now,
    entityType: "fsbo_listing",
    entityId: "lst1",
    actorType: "seller",
    workflowType: "fsbo_seller_documents",
    fsboListingId: "lst1",
    ownerUserId: "u1",
    listingOwnerType: "SELLER",
    listingStatus: "DRAFT",
    moderationStatus: "PENDING",
    documents: [],
    supportingDocuments: [],
    supportingDocumentsSameUserOtherListings: [],
    verificationCases: [],
    aggregates: {
      supportingRejectedInWindow: 0,
      supportingPendingInWindow: 0,
      supportingCreatedInWindow: 0,
      supportingTotalInWindow: 0,
      slotRejectedCount: 0,
      slotPendingReviewCount: 0,
      slotMissingCriticalCount: 0,
    },
    ...over,
  };
}

describe("duplicateDocumentDetector", () => {
  it("does not fire on normal single upload", () => {
    const s = baseSnapshot({
      supportingDocuments: [
        {
          id: "1",
          userId: "u1",
          fsboListingId: "lst1",
          originalFileName: "a.pdf",
          mimeType: "application/pdf",
          category: "OTHER",
          status: "PENDING",
          createdAt: "2026-04-01T10:00:00.000Z",
          updatedAt: "2026-04-01T10:00:00.000Z",
        },
      ],
    });
    const r = duplicateDocumentDetector.run(s);
    expect(r).toHaveLength(0);
  });

  it("fires when same filename+mime repeated beyond threshold", () => {
    const dup = {
      userId: "u1",
      fsboListingId: "lst1",
      originalFileName: "dup.pdf",
      mimeType: "application/pdf",
      category: "OTHER",
      status: "PENDING" as const,
      createdAt: "2026-04-01T10:00:00.000Z",
      updatedAt: "2026-04-01T10:00:00.000Z",
    };
    const s = baseSnapshot({
      supportingDocuments: [
        { id: "1", ...dup },
        { id: "2", ...dup },
        { id: "3", ...dup },
      ],
    });
    const r = duplicateDocumentDetector.run(s);
    expect(r.length).toBeGreaterThanOrEqual(1);
    expect(r[0]?.explanation.length).toBeGreaterThan(10);
    expect(r[0]?.signalType).toBe("duplicate_document");
  });

  it("never throws", () => {
    expect(() => duplicateDocumentDetector.run(baseSnapshot())).not.toThrow();
  });
});
