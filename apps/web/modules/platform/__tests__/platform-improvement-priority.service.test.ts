import { describe, expect, it } from "vitest";
import { buildPlatformClarityReview } from "../platform-clarity-review.service";
import { buildPlatformDataMoatReview } from "../platform-data-moat-review.service";
import { buildPlatformImprovementPriorities } from "../platform-improvement-priority.service";
import { buildPlatformMonetizationReview } from "../platform-monetization-review.service";
import { buildPlatformOpsReview } from "../platform-ops-review.service";
import { mergeTestPlatformReviewSnapshot } from "../platform-review-snapshot";
import { buildPlatformTrustReview } from "../platform-trust-review.service";

describe("buildPlatformImprovementPriorities", () => {
  it("returns at most five priorities", () => {
    const snapshot = mergeTestPlatformReviewSnapshot({ billingV1: false, trustIndicatorsV1: false });
    const priorities = buildPlatformImprovementPriorities({
      clarity: buildPlatformClarityReview(snapshot),
      monetization: buildPlatformMonetizationReview(snapshot),
      trust: buildPlatformTrustReview(snapshot),
      ops: buildPlatformOpsReview(snapshot),
      dataMoat: buildPlatformDataMoatReview(snapshot),
      snapshot,
    });
    expect(priorities.length).toBeLessThanOrEqual(5);
  });
});
