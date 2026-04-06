import { describe, expect, it } from "vitest";
import { computeListingRankingScore, rankListings } from "@/lib/ranking/ranking-engine";

describe("ranking-engine", () => {
  it("computes score in 0..1 range for normalized features", () => {
    const s = computeListingRankingScore({
      bookingsNorm: 1,
      viewsNorm: 1,
      conversionRateNorm: 1,
      hostResponseSpeedNorm: 1,
      contentQualityNorm: 1,
    });
    expect(s).toBeCloseTo(1, 5);
  });

  it("applies featured placement multiplier", () => {
    const base = computeListingRankingScore({
      bookingsNorm: 0.5,
      viewsNorm: 0.5,
      conversionRateNorm: 0.5,
      hostResponseSpeedNorm: 0.5,
      contentQualityNorm: 0.5,
    });
    const boosted = computeListingRankingScore({
      bookingsNorm: 0.5,
      viewsNorm: 0.5,
      conversionRateNorm: 0.5,
      hostResponseSpeedNorm: 0.5,
      contentQualityNorm: 0.5,
      featuredPlacementActive: true,
    });
    expect(boosted / base).toBeCloseTo(1.5, 5);
  });

  it("sorts listings by score descending", () => {
    const r = rankListings([
      { id: "a", features: { bookingsNorm: 0.2, viewsNorm: 0.2, conversionRateNorm: 0.2, hostResponseSpeedNorm: 0.2, contentQualityNorm: 0.2 } },
      { id: "b", features: { bookingsNorm: 0.9, viewsNorm: 0.5, conversionRateNorm: 0.8, hostResponseSpeedNorm: 0.7, contentQualityNorm: 0.6 } },
    ]);
    expect(r[0]?.id).toBe("b");
  });
});
