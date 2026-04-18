import { describe, expect, it, vi } from "vitest";
import * as builder from "../legal-intelligence-signal-builder.service";
import * as registry from "../detectors/legal-detector-registry";
import { summarizeLegalIntelligence } from "../legal-intelligence.service";

describe("summarizeLegalIntelligence", () => {
  it("is deterministic for same mocked signals", async () => {
    vi.spyOn(builder, "buildLegalIntelligenceSnapshot").mockResolvedValue({
      builtAt: "2026-04-01T12:00:00.000Z",
      windowStart: "2026-03-01T12:00:00.000Z",
      windowEnd: "2026-04-01T12:00:00.000Z",
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
    });
    vi.spyOn(registry, "runLegalDetectors").mockReturnValue([]);
    const a = await summarizeLegalIntelligence({
      entityType: "fsbo_listing",
      entityId: "lst1",
      actorType: "seller",
      workflowType: "fsbo_seller_documents",
    });
    const b = await summarizeLegalIntelligence({
      entityType: "fsbo_listing",
      entityId: "lst1",
      actorType: "seller",
      workflowType: "fsbo_seller_documents",
    });
    expect(a).toEqual(b);
    vi.restoreAllMocks();
  });

  it("does not throw when builder fails", async () => {
    vi.spyOn(builder, "buildLegalIntelligenceSnapshot").mockRejectedValue(new Error("db"));
    await expect(
      summarizeLegalIntelligence({
        entityType: "fsbo_listing",
        entityId: "lst1",
        actorType: "seller",
        workflowType: "fsbo_seller_documents",
      }),
    ).resolves.toMatchObject({ totalSignals: 0 });
    vi.restoreAllMocks();
  });
});
