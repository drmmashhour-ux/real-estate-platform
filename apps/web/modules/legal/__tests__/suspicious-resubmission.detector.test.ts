import { describe, expect, it } from "vitest";
import { suspiciousResubmissionDetector } from "../detectors/suspicious-resubmission.detector";
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

describe("suspiciousResubmissionDetector", () => {
  it("does not fire when counts are low", () => {
    const r = suspiciousResubmissionDetector.run(
      snap({
        supportingRejectedInWindow: 1,
        supportingPendingInWindow: 0,
        supportingCreatedInWindow: 2,
        supportingTotalInWindow: 2,
        slotRejectedCount: 0,
        slotPendingReviewCount: 0,
        slotMissingCriticalCount: 0,
      }),
    );
    expect(r).toHaveLength(0);
  });

  it("fires when rejected and created counts exceed thresholds", () => {
    const r = suspiciousResubmissionDetector.run(
      snap({
        supportingRejectedInWindow: 4,
        supportingPendingInWindow: 0,
        supportingCreatedInWindow: 6,
        supportingTotalInWindow: 10,
        slotRejectedCount: 0,
        slotPendingReviewCount: 0,
        slotMissingCriticalCount: 0,
      }),
    );
    expect(r).toHaveLength(1);
    expect(r[0]?.signalType).toBe("suspicious_resubmission_pattern");
  });

  it("never throws", () => {
    expect(() =>
      suspiciousResubmissionDetector.run(
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
