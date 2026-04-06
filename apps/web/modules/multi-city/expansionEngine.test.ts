import { describe, expect, it } from "vitest";
import type { CitySupplyDemandSnapshot } from "./cityMetrics";
import { computeExpansionScore, rankCitiesByOpportunity, suggestNextExpansionSlug } from "./expansionEngine";

const baseSnap = (): CitySupplyDemandSnapshot => ({
  activeFsboListings: 10,
  publishedBnhubListings: 5,
  activeListings: 15,
  hostsDistinct: 3,
  bookings90d: 4,
  leads90d: 20,
  usersInMarket: 100,
  revenueCents90d: 500_000,
  buyerToListingRatio: 20 / 15,
  bookingsPerHost: 4 / 3,
});

describe("expansionEngine", () => {
  it("computeExpansionScore returns 0–100", () => {
    const s = computeExpansionScore(baseSnap());
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(100);
  });

  it("rankCitiesByOpportunity sorts by score desc", () => {
    const r = rankCitiesByOpportunity([
      { slug: "a", expansionScore: 10 },
      { slug: "b", expansionScore: 40 },
      { slug: "c", expansionScore: null },
    ]);
    expect(r.map((x) => x.slug)).toEqual(["b", "a", "c"]);
    expect(r[1].score).toBe(10);
    expect(r[2].score).toBe(0);
  });

  it("suggestNextExpansionSlug picks highest-score testing city", () => {
    const slug = suggestNextExpansionSlug([
      { slug: "live", status: "active", expansionScore: 99 },
      { slug: "next", status: "testing", expansionScore: 30 },
      { slug: "later", status: "testing", expansionScore: 10 },
    ]);
    expect(slug).toBe("next");
  });

  it("suggestNextExpansionSlug returns null when no testing", () => {
    expect(suggestNextExpansionSlug([{ slug: "x", status: "active", expansionScore: 1 }])).toBeNull();
  });
});
