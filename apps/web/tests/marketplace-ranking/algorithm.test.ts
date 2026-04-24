import { describe, expect, it } from "vitest";
import {
  buildRankingContextPayload,
  rankListingsAlgorithm,
  type RankableListingInput,
} from "@/lib/marketplace-ranking/ranking-algorithm.engine";
import { getMarketplaceRankingWeights } from "@/lib/marketplace-ranking/ranking-weights";

const baseListing = (over: Partial<RankableListingInput>): RankableListingInput => ({
  id: "l1",
  title: "Spacious condo in Laval with great light",
  city: "Laval",
  region: "QC",
  nightPriceCents: 150_00,
  maxGuests: 4,
  beds: 2,
  propertyType: "Condo",
  listingStatus: "PUBLISHED",
  photos: ["a.jpg", "b.jpg", "c.jpg"],
  description: "x".repeat(200),
  amenities: ["wifi", "kitchen", "parking"],
  createdAt: new Date(),
  updatedAt: new Date(),
  verificationStatus: "VERIFIED",
  _count: { reviews: 3, bookings: 5 },
  ...over,
});

describe("marketplace ranking algorithm", () => {
  it("weights sum to 1 after normalization", () => {
    const { weights } = getMarketplaceRankingWeights("baseline");
    const s = Object.values(weights).reduce((a, b) => a + b, 0);
    expect(s).toBeCloseTo(1, 5);
  });

  it("ranks stronger quality listing ahead when relevance similar", () => {
    const ctx = buildRankingContextPayload(
      { location: "Laval", minPrice: 100, maxPrice: 200 },
      { sortIntent: "RELEVANCE", marketSegment: "SHORT_TERM" },
    );
    const a = baseListing({ id: "a", title: "x", description: "", photos: [], amenities: [] });
    const b = baseListing({ id: "b" });
    const { ranked } = rankListingsAlgorithm(ctx, [a, b]);
    const first = ranked[0]?.listing.id;
    expect(first).toBe("b");
  });

  it("excludes unpublished listings without hiding the reason", () => {
    const ctx = buildRankingContextPayload({}, { sortIntent: "RELEVANCE", marketSegment: "SHORT_TERM" });
    const draft = baseListing({ id: "d", listingStatus: "DRAFT" });
    const { ranked } = rankListingsAlgorithm(ctx, [draft]);
    expect(ranked[0]?.breakdown.excluded).toBe(true);
    expect(ranked[0]?.breakdown.exclusionReason).toBe("not_published");
  });

  it("applies duplicate_suspected penalty transparently", () => {
    const ctx = buildRankingContextPayload({}, { sortIntent: "RELEVANCE", marketSegment: "SHORT_TERM" });
    const clean = baseListing({ id: "c1" });
    const dup = baseListing({ id: "c2", duplicateSuspected: true });
    const { ranked } = rankListingsAlgorithm(ctx, [clean, dup]);
    const dupRow = ranked.find((r) => r.listing.id === "c2");
    expect(dupRow?.breakdown.penalties).toContain("duplicate_suspected");
    expect((dupRow?.totalScore ?? 0) < (ranked.find((r) => r.listing.id === "c1")?.totalScore ?? 0)).toBe(true);
  });
});
