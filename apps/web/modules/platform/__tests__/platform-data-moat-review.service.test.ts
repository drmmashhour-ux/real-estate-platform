import { describe, expect, it } from "vitest";
import { buildPlatformDataMoatReview } from "../platform-data-moat-review.service";
import { mergeTestPlatformReviewSnapshot } from "../platform-review-snapshot";

describe("buildPlatformDataMoatReview", () => {
  it("lists captured and missing signals", () => {
    const r = buildPlatformDataMoatReview(mergeTestPlatformReviewSnapshot({}));
    expect(r.capturedSignals.length).toBeGreaterThan(0);
    expect(r.missingHighValueSignals.length).toBeGreaterThan(0);
  });

  it("adds listing metrics gap when metrics off", () => {
    const r = buildPlatformDataMoatReview(mergeTestPlatformReviewSnapshot({ listingMetricsV1: false }));
    expect(r.missingHighValueSignals.some((x) => x.toLowerCase().includes("granular"))).toBe(true);
  });
});
