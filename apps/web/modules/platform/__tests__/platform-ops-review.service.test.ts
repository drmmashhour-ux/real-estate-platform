import { describe, expect, it } from "vitest";
import { buildPlatformOpsReview } from "../platform-ops-review.service";
import { mergeTestPlatformReviewSnapshot } from "../platform-review-snapshot";

describe("buildPlatformOpsReview", () => {
  it("returns five command surfaces", () => {
    const r = buildPlatformOpsReview(mergeTestPlatformReviewSnapshot({}));
    expect(r.surfaces).toHaveLength(5);
  });

  it("notes mission control when flag off", () => {
    const r = buildPlatformOpsReview(mergeTestPlatformReviewSnapshot({ growthMissionControlV1: false }));
    const mc = r.surfaces.find((s) => s.surfaceId === "mission_control");
    expect(mc?.note.toLowerCase()).toContain("off");
  });
});
