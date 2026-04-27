import { describe, expect, it } from "vitest";
import type { BnhubListingForRanking } from "@repo/ai/bnhub-search";
import type { UserProfile } from "@/lib/ai/userProfile";
import { rankSearchResults, type BnhubListingWithRanking, type DemandHeatmapRowLite } from "../ranking";

function heat(city: string, demandScore: number): DemandHeatmapRowLite {
  return { city, demandScore };
}

function row(
  partial: Partial<BnhubListingForRanking> & { id: string; nightPriceCents: number }
): BnhubListingForRanking {
  return {
    id: partial.id,
    title: partial.title ?? "Stay",
    city: partial.city,
    nightPriceCents: partial.nightPriceCents,
    createdAt: partial.createdAt ?? "2024-06-01T00:00:00.000Z",
    bnhubListingRatingAverage: partial.bnhubListingRatingAverage ?? 4.5,
    bnhubListingCompletedStays: partial.bnhubListingCompletedStays ?? 5,
    _count: partial._count ?? { reviews: 1, bookings: 5 },
    ...partial,
  };
}

describe("rankSearchResults (Order 82)", () => {
  const highMontreal = async () => [heat("montreal", 500), heat("vancouver", 5)];
  const flat = async () => [heat("montreal", 10), heat("vancouver", 10)];

  it("ranks exact city param higher when query matches both titles", async () => {
    const a = row({ id: "a", city: "Montreal", title: "Old Port loft", nightPriceCents: 10_000 });
    const b = row({ id: "b", city: "Laval", title: "Old Port style", nightPriceCents: 10_000 });
    const out = await rankSearchResults({
      listings: [b, a],
      query: "old port",
      city: "Montreal",
      userProfile: null,
      getHeatmap: highMontreal,
    });
    expect((out[0] as BnhubListingWithRanking).id).toBe("a");
  });

  it("ranks preferred city higher when search city does not give exact match to either", async () => {
    const userProfile: UserProfile = {
      preferredCities: ["Laval"],
      avgPriceRange: { min: 0, max: 0 },
      viewedListings: [],
      behaviorType: "browser",
    };
    const a = row({ id: "a", city: "Montreal", title: "Cozy space", nightPriceCents: 10_000 });
    const c = row({ id: "c", city: "Laval", title: "Cozy space", nightPriceCents: 10_000 });
    const out = await rankSearchResults({
      listings: [a, c],
      query: "cozy",
      city: null,
      userProfile,
      getHeatmap: flat,
    });
    expect((out[0] as BnhubListingWithRanking).id).toBe("c");
  });

  it("ranks high demand city higher with otherwise equal rows", async () => {
    const a = row({
      id: "a",
      city: "Vancouver",
      title: "Stay",
      nightPriceCents: 10_000,
      createdAt: "2024-01-01T00:00:00.000Z",
    });
    const b = row({
      id: "b",
      city: "Montreal",
      title: "Stay",
      nightPriceCents: 10_000,
      createdAt: "2024-01-01T00:00:00.000Z",
    });
    const out = await rankSearchResults({
      listings: [a, b],
      query: "",
      city: null,
      userProfile: null,
      getHeatmap: highMontreal,
    });
    const ids = (out as BnhubListingWithRanking[]).map((x) => x.id);
    expect(ids.indexOf("b")).toBeLessThan(ids.indexOf("a"));
  });

  it("higher real social proof (bookings) can rank first", async () => {
    const low = row({
      id: "lo",
      city: "Montreal",
      title: "X",
      nightPriceCents: 10_000,
      bnhubListingCompletedStays: 0,
      _count: { reviews: 0, bookings: 0 },
    });
    const high = row({
      id: "hi",
      city: "Montreal",
      title: "X",
      nightPriceCents: 10_000,
      bnhubListingCompletedStays: 50,
      _count: { reviews: 5, bookings: 50 },
    });
    const out = await rankSearchResults({
      listings: [low, high],
      query: "x",
      city: "Montreal",
      userProfile: null,
      getHeatmap: async () => [heat("montreal", 100), heat("laval", 100)],
    });
    expect((out[0] as BnhubListingWithRanking).id).toBe("hi");
  });

  it("ties broken deterministically by id", async () => {
    const t = "2024-01-01T00:00:00.000Z";
    const a = row({ id: "y", city: "X", title: "Same", nightPriceCents: 10_000, createdAt: t });
    const c = row({ id: "m", city: "X", title: "Same", nightPriceCents: 10_000, createdAt: t });
    const out = await rankSearchResults({
      listings: [a, c],
      query: "same",
      city: "X",
      userProfile: null,
      getHeatmap: async () => [],
    });
    const scores = (out as BnhubListingWithRanking[]).map((o) => o.rankingScore);
    expect(scores[0]).toBe(scores[1]);
    expect(out[0]!.id < out[1]!.id).toBe(true);
  });
});
