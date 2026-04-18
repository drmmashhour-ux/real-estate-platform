import { describe, expect, it } from "vitest";
import { reviewDelayRiskDetector } from "../detectors/review-delay-risk.detector";
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

describe("reviewDelayRiskDetector", () => {
  it("does not fire when pending_review is recent", () => {
    const now = "2026-04-01T12:00:00.000Z";
    const s: LegalIntelligenceSnapshot = {
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
      documents: [
        {
          id: "d1",
          source: "fsbo_slot",
          docType: "ownership",
          fileName: "x.pdf",
          status: "pending_review",
          createdAt: "2026-04-01T08:00:00.000Z",
          updatedAt: "2026-04-01T11:00:00.000Z",
          fsboListingId: "lst1",
        },
      ],
      supportingDocuments: [],
      supportingDocumentsSameUserOtherListings: [],
      verificationCases: [],
      aggregates: emptyAgg(),
    };
    const r = reviewDelayRiskDetector.run(s);
    expect(r.filter((x) => x.signalType === "review_delay_risk")).toHaveLength(0);
  });

  it("fires for old pending_review slot", () => {
    const now = "2026-04-10T12:00:00.000Z";
    const s: LegalIntelligenceSnapshot = {
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
      documents: [
        {
          id: "d1",
          source: "fsbo_slot",
          docType: "ownership",
          fileName: "x.pdf",
          status: "pending_review",
          createdAt: "2026-03-01T08:00:00.000Z",
          updatedAt: "2026-04-01T08:00:00.000Z",
          fsboListingId: "lst1",
        },
      ],
      supportingDocuments: [],
      supportingDocumentsSameUserOtherListings: [],
      verificationCases: [],
      aggregates: emptyAgg(),
    };
    const r = reviewDelayRiskDetector.run(s);
    expect(r.some((x) => x.signalType === "review_delay_risk")).toBe(true);
  });

  it("never throws", () => {
    const now = "2026-04-01T12:00:00.000Z";
    const s: LegalIntelligenceSnapshot = {
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
      aggregates: emptyAgg(),
    };
    expect(() => reviewDelayRiskDetector.run(s)).not.toThrow();
  });
});
