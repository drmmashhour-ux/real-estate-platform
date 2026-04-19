import { describe, expect, it } from "vitest";
import { buildPlatformClarityReview } from "../platform-clarity-review.service";
import { buildPlatformDataMoatReview } from "../platform-data-moat-review.service";
import {
  buildPlatformImprovementPriorities,
  buildWeeklyFocusList,
} from "../platform-improvement-priority.service";
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

  it("buildWeeklyFocusList excludes done/dismissed and caps at three", () => {
    const snapshot = mergeTestPlatformReviewSnapshot({ billingV1: false, trustIndicatorsV1: false });
    const priorities = buildPlatformImprovementPriorities({
      clarity: buildPlatformClarityReview(snapshot),
      monetization: buildPlatformMonetizationReview(snapshot),
      trust: buildPlatformTrustReview(snapshot),
      ops: buildPlatformOpsReview(snapshot),
      dataMoat: buildPlatformDataMoatReview(snapshot),
      snapshot,
    });
    if (priorities.length === 0) return;
    const statusById: Record<string, "done" | "new"> = {};
    statusById[priorities[0]!.id] = "done";
    const focus = buildWeeklyFocusList(priorities, statusById);
    expect(focus.length).toBeLessThanOrEqual(3);
    expect(focus.every((p) => p.id !== priorities[0]!.id)).toBe(true);
  });
});
