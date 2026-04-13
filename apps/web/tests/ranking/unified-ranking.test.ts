import { describe, expect, it } from "vitest";
import type { RankingSignalBundle } from "@/src/modules/ranking/types";
import {
  computeRankScore,
  DEFAULT_UNIFIED_RANK_WEIGHTS,
  mapSignalsToRankComponents,
  UNIFIED_WEIGHTS_WITHOUT_EXPLORATION,
} from "@/lib/ranking/compute-rank-score";
import { blendPerformanceAndExploration, computeExplorationScore } from "@/lib/ranking/exploration";
import { diversifyByAreaAndType, diversifyByHost } from "@/lib/ranking/diversity";
import { computeBnhubFinalSearchScore } from "@/lib/ranking/compute-bnhub-score";
import type { BnhubListingRankingInput } from "@/src/modules/ranking/types";

function baseSignals(partial: Partial<RankingSignalBundle>): RankingSignalBundle {
  return {
    relevance: 0.7,
    trust: 0.7,
    quality: 0.7,
    engagement: 0.5,
    conversion: 0.5,
    freshness: 0.5,
    host: 0.6,
    review: 0.6,
    priceCompetitiveness: 0.6,
    availability: 0.8,
    ...partial,
  };
}

describe("unified ranking", () => {
  it("ranks higher relevance + quality above lower signals", () => {
    const low = mapSignalsToRankComponents(baseSignals({ relevance: 0.4, quality: 0.4 }), 0);
    const high = mapSignalsToRankComponents(baseSignals({ relevance: 0.95, quality: 0.95 }), 0);
    expect(computeRankScore(high, DEFAULT_UNIFIED_RANK_WEIGHTS)).toBeGreaterThan(
      computeRankScore(low, DEFAULT_UNIFIED_RANK_WEIGHTS)
    );
  });

  it("uses UNIFIED_WEIGHTS_WITHOUT_EXPLORATION so exploration can be blended separately", () => {
    const c = mapSignalsToRankComponents(baseSignals({}), 0);
    const withExpl = mapSignalsToRankComponents(baseSignals({}), 0.9);
    const a = computeRankScore(c, UNIFIED_WEIGHTS_WITHOUT_EXPLORATION);
    const b = computeRankScore(withExpl, DEFAULT_UNIFIED_RANK_WEIGHTS);
    expect(a).toBeLessThan(b);
    const blended = blendPerformanceAndExploration(a, 0.9, 0.2);
    expect(blended).toBeGreaterThanOrEqual(a);
  });

  it("computeExplorationScore boosts newer listings vs stale", () => {
    const old = new Date(Date.now() - 400 * 86400000);
    const recent = new Date(Date.now() - 2 * 86400000);
    const eOld = computeExplorationScore({
      createdAt: old,
      views30d: 10,
      qualityScore: 0.7,
    });
    const eNew = computeExplorationScore({
      createdAt: recent,
      views30d: 10,
      qualityScore: 0.7,
    });
    expect(eNew).toBeGreaterThan(eOld);
  });

  it("diversifyByHost limits repeats in prefix", () => {
    const rows = [
      { id: "1", owner: "a" },
      { id: "2", owner: "a" },
      { id: "3", owner: "a" },
      { id: "4", owner: "b" },
      { id: "5", owner: "b" },
    ];
    const out = diversifyByHost(rows, (r) => r.owner, { maxPerHostInPrefix: 1, prefixLength: 4 });
    expect(out[0]?.owner).not.toBe(out[1]?.owner);
  });

  it("diversifyByAreaAndType interleaves buckets", () => {
    const rows = [
      { id: "1", b: "x" },
      { id: "2", b: "x" },
      { id: "3", b: "y" },
    ];
    const out = diversifyByAreaAndType(rows, (r) => r.b, { maxPerBucketInPrefix: 1, prefixLength: 3 });
    expect(out.map((r) => r.id).join(",")).toContain("3");
  });

  it("computeBnhubFinalSearchScore returns 0-100 final", () => {
    const signals = baseSignals({});
    const input = {
      id: "t",
      city: "Montreal",
      region: null,
      nightPriceCents: 10000,
      maxGuests: 2,
      propertyType: "condo",
      roomType: null,
      amenities: [],
      photos: [],
      description: "x".repeat(200),
      verificationStatus: "VERIFIED",
      listingVerificationStatus: "VERIFIED",
      listingStatus: "PUBLISHED",
      ownerId: "o1",
      createdAt: new Date(),
      updatedAt: new Date(),
      instantBookEnabled: true,
      houseRules: "rules",
      checkInInstructions: "in",
      photoCount: 4,
      reviewAvg: 4.5,
      reviewCount: 2,
      completedBookings: 1,
      disputeCount: 0,
      favoriteCount: 0,
      aggregateAvgRating: 4.5,
      aggregateTotalReviews: 2,
      hostPerformanceScore: 70,
      hostHasFastResponder: false,
      hostHasReliable: false,
      medianNightPriceCents: 10000,
      reputationRankBoost: 0,
    } satisfies BnhubListingRankingInput;
    const { final0to100 } = computeBnhubFinalSearchScore(signals, input, null);
    expect(final0to100).toBeGreaterThanOrEqual(0);
    expect(final0to100).toBeLessThanOrEqual(100);
  });
});
