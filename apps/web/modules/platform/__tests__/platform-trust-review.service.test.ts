import { describe, expect, it } from "vitest";
import { buildPlatformTrustReview, buildTrustStripLines } from "../platform-trust-review.service";
import { mergeTestPlatformReviewSnapshot } from "../platform-review-snapshot";

describe("buildPlatformTrustReview", () => {
  it("adds coverage gaps when trust indicators off", () => {
    const r = buildPlatformTrustReview(mergeTestPlatformReviewSnapshot({ trustIndicatorsV1: false }));
    expect(r.coverageGaps.length).toBeGreaterThan(0);
  });
});

describe("buildTrustStripLines", () => {
  it("returns only lines backed by true inputs", () => {
    const lines = buildTrustStripLines({
      verifiedListing: true,
      secureCheckoutEnabled: true,
    });
    expect(lines.some((l) => l.key === "verified_listing")).toBe(true);
    expect(lines.some((l) => l.key === "no_hidden_fees")).toBe(false);
  });

  it("caps at five lines", () => {
    const lines = buildTrustStripLines({
      verifiedListing: true,
      verifiedHostOrBroker: true,
      updatedAt: new Date().toISOString(),
      secureCheckoutEnabled: true,
      showNoHiddenFeesCopy: true,
      realOpportunityNote: "x",
    });
    expect(lines.length).toBeLessThanOrEqual(5);
  });
});
