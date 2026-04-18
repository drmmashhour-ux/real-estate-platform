import { describe, expect, it } from "vitest";
import { highRejectionRateDetector } from "../detectors/high-rejection-rate.detector";
import type { LegalIntelligenceSnapshot } from "../legal-intelligence.types";

function snap(agg: LegalIntelligenceSnapshot["aggregates"]): LegalIntelligenceSnapshot {
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
    aggregates: agg,
  };
}

describe("highRejectionRateDetector", () => {
  it("does not fire when ratio below threshold", () => {
    const r = highRejectionRateDetector.run(
      snap({
        supportingRejectedInWindow: 2,
        supportingPendingInWindow: 0,
        supportingCreatedInWindow: 10,
        supportingTotalInWindow: 10,
        slotRejectedCount: 0,
        slotPendingReviewCount: 0,
        slotMissingCriticalCount: 0,
      }),
    );
    expect(r).toHaveLength(0);
  });

  it("fires when rejection ratio high enough", () => {
    const r = highRejectionRateDetector.run(
      snap({
        supportingRejectedInWindow: 6,
        supportingPendingInWindow: 0,
        supportingCreatedInWindow: 10,
        supportingTotalInWindow: 10,
        slotRejectedCount: 0,
        slotPendingReviewCount: 0,
        slotMissingCriticalCount: 0,
      }),
    );
    expect(r.length).toBeGreaterThanOrEqual(1);
    expect(r[0]?.signalType).toBe("high_rejection_rate");
  });

  it("never throws", () => {
    expect(() =>
      highRejectionRateDetector.run(
        snap({
          supportingRejectedInWindow: 0,
          supportingPendingInWindow: 0,
          supportingCreatedInWindow: 0,
          supportingTotalInWindow: 0,
          slotRejectedCount: 0,
          slotPendingReviewCount: 0,
          slotMissingCriticalCount: 0,
        }),
      ),
    ).not.toThrow();
  });
});
