import { describe, expect, it } from "vitest";
import {
  dealBucketFromRecommendation,
  fraudBucketFromScore,
  normalizeHumanDealLabel,
  normalizeHumanTrustLabel,
  trustBucketFromScore,
} from "./bucketMaps";

describe("bucketMaps", () => {
  it("trustBucketFromScore matches LECIPM bands", () => {
    expect(trustBucketFromScore(20)).toBe("critical");
    expect(trustBucketFromScore(50)).toBe("caution");
    expect(trustBucketFromScore(70)).toBe("strong");
    expect(trustBucketFromScore(90)).toBe("verified");
  });

  it("normalizes human trust labels", () => {
    expect(normalizeHumanTrustLabel("low")).toBe("critical");
    expect(normalizeHumanTrustLabel("verified")).toBe("verified");
  });

  it("deal buckets from recommendation", () => {
    expect(dealBucketFromRecommendation("avoid")).toBe("negative");
    expect(dealBucketFromRecommendation("strong_opportunity")).toBe("strong");
  });

  it("normalizes human deal labels", () => {
    expect(normalizeHumanDealLabel("weak")).toBe("negative");
    expect(normalizeHumanDealLabel("strong")).toBe("strong");
  });

  it("fraud score to risk bucket", () => {
    expect(fraudBucketFromScore(10)).toBe("low");
    expect(fraudBucketFromScore(50)).toBe("medium");
    expect(fraudBucketFromScore(80)).toBe("high");
  });
});
