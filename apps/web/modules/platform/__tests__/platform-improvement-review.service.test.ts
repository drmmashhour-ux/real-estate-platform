import { describe, expect, it } from "vitest";
import { buildFullPlatformImprovementBundle } from "../platform-improvement-review.service";
import { mergeTestPlatformReviewSnapshot } from "../platform-review-snapshot";

describe("buildFullPlatformImprovementBundle", () => {
  it("returns a complete bundle with ISO timestamp", () => {
    const b = buildFullPlatformImprovementBundle(mergeTestPlatformReviewSnapshot({}));
    expect(b.priorities.length).toBeLessThanOrEqual(5);
    expect(b.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(b.clarity.surfaces.length).toBe(6);
  });

  it("does not mutate injected snapshot", () => {
    const snap = mergeTestPlatformReviewSnapshot({ demoMode: true });
    const before = JSON.stringify(snap);
    buildFullPlatformImprovementBundle(snap);
    expect(JSON.stringify(snap)).toBe(before);
  });
});
