import { describe, expect, it } from "vitest";

import { rankListings, type FeedListingForRank } from "../feedRanking";
import type { UserProfile } from "../userProfile";

const base: FeedListingForRank = {
  id: "1",
  title: "A",
  city: "Montréal",
  price: 100,
  createdAt: new Date("2026-01-15T12:00:00Z"),
  demandScore: 10,
  imageUrl: null,
  socialProofScore: 0,
  socialProofStrength: "low",
  listingReputationScore: 0,
  reputationLevel: "low",
  ownerId: "host-1",
};

const profilePrefMtl: UserProfile = {
  preferredCities: ["Montréal"],
  avgPriceRange: { min: 50, max: 150 },
  viewedListings: [],
  behaviorType: "browser",
};

describe("feedRanking", () => {
  it("orders preferred city above others when other signals match", () => {
    const mtl: FeedListingForRank = { ...base, id: "m", city: "Montréal" };
    const to: FeedListingForRank = {
      ...base,
      id: "t",
      city: "Toronto",
      price: 100,
      createdAt: mtl.createdAt,
      demandScore: 10,
      socialProofScore: 0,
      socialProofStrength: "low",
      listingReputationScore: 0,
      reputationLevel: "low",
      ownerId: "host-1",
    };
    const out = rankListings([to, mtl], profilePrefMtl, {
      random01: () => 0,
      now: new Date("2026-01-20T12:00:00Z"),
    });
    expect(out[0]!.id).toBe("m");
    expect(out[1]!.id).toBe("t");
  });

  it("applies session city boost when not in profile preferences", () => {
    const emptyProfile: UserProfile = {
      preferredCities: [],
      avgPriceRange: { min: 0, max: 0 },
      viewedListings: [],
      behaviorType: "new",
    };
    const mtl: FeedListingForRank = { ...base, id: "m", city: "Montréal" };
    const to: FeedListingForRank = {
      ...base,
      id: "t",
      city: "Toronto",
      createdAt: mtl.createdAt,
      demandScore: 10,
      price: 100,
      socialProofScore: 0,
      socialProofStrength: "low",
    };
    const out = rankListings([mtl, to], emptyProfile, {
      sessionBoostCities: ["Toronto"],
      random01: () => 0,
      now: new Date("2026-01-20T12:00:00Z"),
    });
    expect(out[0]!.city).toBe("Toronto");
  });

  it("prioritizes listings with stronger social proof score (Order 47)", () => {
    const emptyProfile: UserProfile = {
      preferredCities: [],
      avgPriceRange: { min: 0, max: 0 },
      viewedListings: [],
      behaviorType: "new",
    };
    const lowSp: FeedListingForRank = {
      ...base,
      id: "low",
      socialProofScore: 0.1,
      socialProofStrength: "low",
    };
    const highSp: FeedListingForRank = {
      ...base,
      id: "high",
      socialProofScore: 0.9,
      socialProofStrength: "high",
    };
    const out = rankListings([lowSp, highSp], emptyProfile, {
      random01: () => 0,
      now: new Date("2026-01-20T12:00:00Z"),
    });
    expect(out[0]!.id).toBe("high");
    expect(out[1]!.id).toBe("low");
  });

  it("boosts trusted listings in rank order (Order 48: reputation × 3 in feed score)", () => {
    const emptyProfile: UserProfile = {
      preferredCities: [],
      avgPriceRange: { min: 0, max: 0 },
      viewedListings: [],
      behaviorType: "new",
    };
    const lowRep: FeedListingForRank = {
      ...base,
      id: "a",
      socialProofScore: 0.5,
      socialProofStrength: "medium",
      listingReputationScore: 0.1,
      reputationLevel: "low",
    };
    const highRep: FeedListingForRank = {
      ...base,
      id: "b",
      socialProofScore: 0.5,
      socialProofStrength: "medium",
      listingReputationScore: 0.85,
      reputationLevel: "high",
    };
    const out = rankListings([lowRep, highRep], emptyProfile, {
      random01: () => 0,
      now: new Date("2026-01-20T12:00:00Z"),
    });
    expect(out[0]!.id).toBe("b");
    expect(out[1]!.id).toBe("a");
  });
});
