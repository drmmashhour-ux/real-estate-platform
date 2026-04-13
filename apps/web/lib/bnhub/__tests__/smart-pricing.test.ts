import { describe, expect, it } from "vitest";
import { computeSmartPrice, MAX_PERCENT_VS_PEER_DISPLAY } from "@/lib/bnhub/smart-pricing";

describe("computeSmartPrice", () => {
  it("clamps negative and NaN listing prices to safe outputs", () => {
    const a = computeSmartPrice({
      listingNightCents: -5000,
      marketAvgCents: 10_000,
      peerBookingsLast30d: 2,
      peerListingCount: 10,
      month: 6,
    });
    expect(a.recommendedPriceCents).toBeGreaterThanOrEqual(100);

    const b = computeSmartPrice({
      listingNightCents: Number.NaN,
      marketAvgCents: null,
      peerBookingsLast30d: 0,
      peerListingCount: 0,
      month: 6,
    });
    expect(b.recommendedPriceCents).toBeGreaterThanOrEqual(100);
    expect(b.confidence).toBe("low");
  });

  it("caps peer listing count contribution to demand ratio", () => {
    const huge = computeSmartPrice({
      listingNightCents: 12_000,
      marketAvgCents: 12_000,
      peerBookingsLast30d: 100,
      peerListingCount: 999_999,
      month: 6,
    });
    expect(huge.factors.demandRatio).toBeLessThanOrEqual(1);
  });
});

describe("MAX_PERCENT_VS_PEER_DISPLAY", () => {
  it("is a reasonable UI clamp constant", () => {
    expect(MAX_PERCENT_VS_PEER_DISPLAY).toBe(400);
  });
});
