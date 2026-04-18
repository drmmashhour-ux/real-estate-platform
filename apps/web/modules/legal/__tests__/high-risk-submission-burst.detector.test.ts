import { describe, expect, it } from "vitest";
import { highRiskSubmissionBurstDetector } from "../detectors/high-risk-submission-burst.detector";
import type { LegalIntelligenceSnapshot } from "../legal-intelligence.types";

function emptyAgg(): LegalIntelligenceSnapshot["aggregates"] {
  return {
    supportingRejectedInWindow: 0,
    supportingPendingInWindow: 0,
    supportingCreatedInWindow: 0,
    supportingTotalInWindow: 0,
    slotRejectedCount: 0,
    slotPendingReviewCount: 0,
    slotMissingCriticalCount: 0,
  };
}

describe("highRiskSubmissionBurstDetector", () => {
  it("does not fire when few uploads in burst window", () => {
    const built = "2026-04-01T14:00:00.000Z";
    const s: LegalIntelligenceSnapshot = {
      builtAt: built,
      windowStart: "2026-03-01T12:00:00.000Z",
      windowEnd: built,
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
      supportingDocuments: Array.from({ length: 3 }).map((_, i) => ({
        id: `s${i}`,
        userId: "u1",
        fsboListingId: "lst1",
        originalFileName: `f${i}.pdf`,
        mimeType: "application/pdf",
        category: "OTHER",
        status: "PENDING",
        createdAt: "2026-04-01T13:30:00.000Z",
        updatedAt: "2026-04-01T13:30:00.000Z",
      })),
      supportingDocumentsSameUserOtherListings: [],
      verificationCases: [],
      aggregates: emptyAgg(),
    };
    expect(highRiskSubmissionBurstDetector.run(s)).toHaveLength(0);
  });

  it("fires when many uploads inside burst window", () => {
    const built = "2026-04-01T14:00:00.000Z";
    const supportingDocuments = Array.from({ length: 10 }).map((_, i) => ({
      id: `s${i}`,
      userId: "u1",
      fsboListingId: "lst1",
      originalFileName: `f${i}.pdf`,
      mimeType: "application/pdf",
      category: "OTHER",
      status: "PENDING" as const,
      createdAt: "2026-04-01T13:30:00.000Z",
      updatedAt: "2026-04-01T13:30:00.000Z",
    }));
    const s: LegalIntelligenceSnapshot = {
      builtAt: built,
      windowStart: "2026-03-01T12:00:00.000Z",
      windowEnd: built,
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
      supportingDocuments,
      supportingDocumentsSameUserOtherListings: [],
      verificationCases: [],
      aggregates: emptyAgg(),
    };
    const r = highRiskSubmissionBurstDetector.run(s);
    expect(r.length).toBeGreaterThanOrEqual(1);
    expect(r[0]?.signalType).toBe("high_risk_submission_burst");
  });

  it("never throws", () => {
    const built = "2026-04-01T14:00:00.000Z";
    const s: LegalIntelligenceSnapshot = {
      builtAt: built,
      windowStart: "2026-03-01T12:00:00.000Z",
      windowEnd: built,
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
      aggregates: emptyAgg(),
    };
    expect(() => highRiskSubmissionBurstDetector.run(s)).not.toThrow();
  });
});
