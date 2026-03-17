/**
 * Tests for AI pricing recommendation output shape and storage.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAiPricingRecommendation } from "@/lib/ai-pricing";

vi.mock("@/lib/bnhub/pricing", () => ({
  getPricingRecommendation: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    aiPricingRecommendation: { create: vi.fn() },
  },
}));

const pricing = await import("@/lib/bnhub/pricing");
const { prisma } = await import("@/lib/db");

describe("AI Pricing", () => {
  beforeEach(() => {
    vi.mocked(pricing.getPricingRecommendation).mockResolvedValue({
      recommendedPriceCents: 12000,
      currentPriceCents: 10000,
      marketAvgCents: 11000,
      demandLevel: "high" as const,
      factors: ["Market average", "Demand: high"],
      minStayNights: 2,
    });
    vi.mocked(prisma.aiPricingRecommendation.create).mockResolvedValue({} as never);
  });

  it("returns recommendedCents, minCents, maxCents, demandLevel, factors", async () => {
    const r = await getAiPricingRecommendation("listing-1", { store: false });
    expect(r.recommendedCents).toBe(12000);
    expect(r.minCents).toBeLessThanOrEqual(r.recommendedCents);
    expect(r.maxCents).toBeGreaterThanOrEqual(r.recommendedCents);
    expect(r.demandLevel).toBe("high");
    expect(r.factors).toContain("Market average");
    expect(r.modelVersion).toBe("pricing_v1");
  });

  it("stores recommendation when store is true", async () => {
    await getAiPricingRecommendation("listing-1", { store: true });
    expect(prisma.aiPricingRecommendation.create).toHaveBeenCalled();
  });
});
