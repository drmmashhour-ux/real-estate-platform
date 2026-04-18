import { describe, expect, it } from "vitest";
import { buildPlatformClarityReview } from "../platform-clarity-review.service";
import { mergeTestPlatformReviewSnapshot } from "../platform-review-snapshot";

describe("buildPlatformClarityReview", () => {
  it("returns all six surfaces", () => {
    const r = buildPlatformClarityReview(mergeTestPlatformReviewSnapshot({}));
    expect(r.surfaces).toHaveLength(6);
    expect(r.surfaces.map((s) => s.surfaceId)).toContain("homepage");
  });

  it("does not mutate snapshot input", () => {
    const snap = mergeTestPlatformReviewSnapshot({ demoMode: true });
    const before = JSON.stringify(snap);
    buildPlatformClarityReview(snap);
    expect(JSON.stringify(snap)).toBe(before);
  });
});
