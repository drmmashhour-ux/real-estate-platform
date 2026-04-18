import { describe, expect, it } from "vitest";
import { buildPlatformMonetizationReview } from "../platform-monetization-review.service";
import { mergeTestPlatformReviewSnapshot } from "../platform-review-snapshot";

describe("buildPlatformMonetizationReview", () => {
  it("flags billing off as value leakage deterministically", () => {
    const r = buildPlatformMonetizationReview(mergeTestPlatformReviewSnapshot({ billingV1: false }));
    expect(r.unmonetizedValueLeakage.some((x) => x.toLowerCase().includes("billing"))).toBe(true);
  });

  it("keeps monetized surfaces non-empty", () => {
    const r = buildPlatformMonetizationReview(mergeTestPlatformReviewSnapshot({}));
    expect(r.monetizedSurfaces.length).toBeGreaterThan(0);
  });
});
