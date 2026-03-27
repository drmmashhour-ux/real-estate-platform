import { describe, expect, it } from "vitest";
import { DealRecommendation } from "@/modules/deal-analyzer/domain/enums";
import { pickEliteRecommendation } from "../infrastructure/eliteDealScoring";

describe("pickEliteRecommendation", () => {
  it("returns insufficient_data when deal confidence is low", () => {
    expect(
      pickEliteRecommendation({
        dealConfidence: 30,
        finalTrustScore: 80,
        finalDealScore: 90,
      })
    ).toBe(DealRecommendation.INSUFFICIENT_DATA);
  });

  it("returns caution when trust is low even if deal score is high", () => {
    expect(
      pickEliteRecommendation({
        dealConfidence: 70,
        finalTrustScore: 30,
        finalDealScore: 85,
      })
    ).toBe(DealRecommendation.CAUTION);
  });

  it("returns strong_opportunity when score and confidence are high", () => {
    expect(
      pickEliteRecommendation({
        dealConfidence: 85,
        finalTrustScore: 70,
        finalDealScore: 75,
      })
    ).toBe(DealRecommendation.STRONG_OPPORTUNITY);
  });

  it("returns worth_reviewing for high score with medium-high confidence", () => {
    expect(
      pickEliteRecommendation({
        dealConfidence: 70,
        finalTrustScore: 70,
        finalDealScore: 75,
      })
    ).toBe(DealRecommendation.WORTH_REVIEWING);
  });
});
