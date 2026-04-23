import { beforeEach, describe, expect, it, vi } from "vitest";

import { suggestPricingRange } from "./listing-pricing.suggester";

const aggregate = vi.fn();
const count = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    listing: {
      aggregate: (...a: unknown[]) => aggregate(...a),
      count: (...a: unknown[]) => count(...a),
    },
  },
}));

describe("suggestPricingRange", () => {
  beforeEach(() => {
    aggregate.mockReset();
    count.mockReset();
  });

  it("exposes transparency fields for healthy sample", async () => {
    count.mockResolvedValue(10);
    aggregate.mockResolvedValue({
      _avg: { price: 500_000 },
      _min: { price: 400_000 },
      _max: { price: 600_000 },
    });
    const p = await suggestPricingRange({ listingType: "HOUSE", currentPriceMajor: 500_000 });
    expect(p.comparableCount).toBe(10);
    expect(p.priceBandLow).toBe(p.suggestedMinMajor);
    expect(p.priceBandHigh).toBe(p.suggestedMaxMajor);
    expect(p.confidenceLevel).toBe("MEDIUM");
    expect(p.thinDataWarning).toBe(false);
  });

  it("sets thin data when sample is small", async () => {
    count.mockResolvedValue(2);
    aggregate.mockResolvedValue({
      _avg: { price: 0 },
      _min: { price: 0 },
      _max: { price: 0 },
    });
    const p = await suggestPricingRange({ listingType: "CONDO", currentPriceMajor: 300_000 });
    expect(p.thinDataWarning).toBe(true);
    expect(p.confidenceLevel).toBe("LOW");
  });
});
