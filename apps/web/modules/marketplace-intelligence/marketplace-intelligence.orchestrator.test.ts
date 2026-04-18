import { describe, it, expect, vi, beforeEach } from "vitest";

const { findUnique } = vi.hoisted(() => ({
  findUnique: vi.fn(),
}));

vi.mock("@/config/feature-flags", () => ({
  marketplaceIntelligenceFlags: {
    marketplaceIntelligenceV1: true,
    marketplaceTrustScoringV1: true,
    marketplaceFraudReviewV1: true,
    marketplaceRankingSignalsV1: true,
    marketplacePricingIntelligenceV1: true,
  },
}));

vi.mock("@/modules/growth/unified-learning.service", () => ({
  maybeIngestMarketplaceLearning: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    shortTermListing: {
      findUnique,
      findMany: vi.fn().mockResolvedValue([]),
      aggregate: vi.fn().mockResolvedValue({ _avg: { nightPriceCents: null } }),
    },
    booking: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    listingQualitySnapshot: { create: vi.fn().mockResolvedValue({ id: "q1" }) },
    listingTrustSnapshot: { create: vi.fn().mockResolvedValue({ id: "t1" }) },
    listingFraudSignal: { create: vi.fn().mockResolvedValue({ id: "f1" }) },
    listingRankingSnapshot: { create: vi.fn().mockResolvedValue({ id: "r1" }) },
    listingPricingRecommendation: { create: vi.fn().mockResolvedValue({ id: "p1" }) },
    marketplaceDecisionLog: { create: vi.fn().mockResolvedValue({ id: "d1" }) },
  },
}));

import { runMarketplaceIntelligenceForListing } from "./marketplace-intelligence.orchestrator";

describe("marketplace-intelligence.orchestrator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when listing is not found", async () => {
    findUnique.mockResolvedValueOnce(null);
    const r = await runMarketplaceIntelligenceForListing("missing-id");
    expect(r).toBeNull();
  });
});
