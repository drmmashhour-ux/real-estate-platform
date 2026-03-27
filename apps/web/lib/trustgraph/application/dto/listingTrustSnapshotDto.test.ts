import { describe, expect, it } from "vitest";
import { toListingTrustSnapshotDto } from "@/lib/trustgraph/application/dto/listingTrustSnapshotDto";

describe("toListingTrustSnapshotDto", () => {
  it("maps safe seller-facing fields only", () => {
    const snap = toListingTrustSnapshotDto({
      caseRow: {
        overallScore: 72,
        trustLevel: "high",
        readinessLevel: "partial",
        updatedAt: new Date("2025-01-01T00:00:00.000Z"),
        summary: {
          missingItems: ["Add exterior photo", "Complete declaration"],
        },
      },
      sellerFacingActionCount: 2,
    });
    expect(snap.displayScore).toBe(72);
    expect(snap.trustLevel).toBe("high");
    expect(snap.missingItemsCount).toBe(2);
    expect(snap.recommendedActionsCount).toBe(2);
    expect(snap.sellerActionRequired).toBe(true);
    expect(snap.publicBadgeLabels.length).toBeGreaterThan(0);
  });

  it("handles missing case", () => {
    const snap = toListingTrustSnapshotDto({ caseRow: null, sellerFacingActionCount: 0 });
    expect(snap.displayScore).toBeNull();
    expect(snap.lastVerifiedAt).toBeNull();
  });
});
