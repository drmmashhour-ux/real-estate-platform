import { describe, expect, it } from "vitest";
import {
  bestValueIndex,
  compareBnhubRanking,
  computeBnhubRankingScore,
  computeNewListingDiscoveryBoost,
  isColdStartTraffic,
  scoreListingQuality,
} from "../bnhub-ranking.service";
import type { BnhubRankingSignals } from "../bnhub-ranking.types";

function baseSignals(over: Partial<BnhubRankingSignals> = {}): BnhubRankingSignals {
  return {
    listingId: "x",
    listingAgeDays: 30,
    photoCount: 6,
    amenityCount: 8,
    descriptionLen: 400,
    verified: true,
    searchViews: 80,
    clicks: 20,
    listingViews: 40,
    bookingStarts: 5,
    bookingsCompleted: 2,
    ctr: 0.25,
    viewToStartRate: 0.125,
    startToPaidRate: 0.4,
    hostResponsiveness01: 0.8,
    priceVsPeerMedian: 0.95,
    peerMedianNightCents: 10000,
    peerSampleSize: 20,
    trafficVolumeScore: 0.7,
    ...over,
  };
}

describe("bnhub-ranking.service", () => {
  it("computeBnhubRankingScore is deterministic", () => {
    const s = baseSignals();
    const a = computeBnhubRankingScore("a", s, 0);
    const b = computeBnhubRankingScore("a", s, 0);
    expect(a.finalScore).toBe(b.finalScore);
    expect(a.explanations).toEqual(b.explanations);
  });

  it("cold-start gives recent listings a small discovery boost vs older cold listings", () => {
    const sparse = baseSignals({
      searchViews: 2,
      clicks: 0,
      listingViews: 3,
      bookingStarts: 0,
      bookingsCompleted: 0,
      ctr: 0,
      viewToStartRate: 0,
      startToPaidRate: 0,
      trafficVolumeScore: 0.1,
    });
    const young = computeBnhubRankingScore("y", { ...sparse, listingAgeDays: 7 }, 0);
    const old = computeBnhubRankingScore("o", { ...sparse, listingAgeDays: 120 }, 0);
    expect(computeNewListingDiscoveryBoost(7, true)).toBeGreaterThan(0);
    expect(computeNewListingDiscoveryBoost(120, true)).toBe(0);
    expect(young.finalScore).toBeGreaterThan(old.finalScore);
    expect(young.signalBreakdown.newListingDiscoveryBoost).toBeGreaterThan(0);
    expect(old.signalBreakdown.newListingDiscoveryBoost).toBe(0);
  });

  it("cold-start dampens low-traffic listings", () => {
    const sparse = baseSignals({
      searchViews: 2,
      clicks: 0,
      listingViews: 3,
      bookingStarts: 0,
      bookingsCompleted: 0,
      ctr: 0,
      viewToStartRate: 0,
      startToPaidRate: 0,
      trafficVolumeScore: 0.1,
    });
    expect(isColdStartTraffic(sparse)).toBe(true);
    const scored = computeBnhubRankingScore("id", sparse, 0);
    expect(scored.signalBreakdown.coldStartDampingApplied).toBe(true);
  });

  it("best_value prefers higher quality per price", () => {
    const s = baseSignals();
    const hi = computeBnhubRankingScore("h", { ...s, photoCount: 12, descriptionLen: 800 }, 0);
    const lo = computeBnhubRankingScore("l", { ...s, photoCount: 2, descriptionLen: 40 }, 0);
    expect(scoreListingQuality({ ...s, photoCount: 12, descriptionLen: 800 })).toBeGreaterThan(
      scoreListingQuality({ ...s, photoCount: 2, descriptionLen: 40 }),
    );
    expect(bestValueIndex(hi, 10000)).toBeGreaterThan(bestValueIndex(lo, 10000));
  });

  it("compareBnhubRanking top_conversion orders by conversion sub-score", () => {
    const s = baseSignals();
    const hiConv = computeBnhubRankingScore("a", { ...s, viewToStartRate: 0.3, startToPaidRate: 0.6 }, 0);
    const loConv = computeBnhubRankingScore("b", { ...s, viewToStartRate: 0.02, startToPaidRate: 0.1 }, 0);
    expect(
      compareBnhubRanking(hiConv, loConv, "top_conversion", 10000, 10000),
    ).toBeLessThan(0);
  });

  it("sparse signals do not crash score", () => {
    const sparse = baseSignals({
      searchViews: 0,
      clicks: 0,
      listingViews: 0,
      bookingStarts: 0,
      bookingsCompleted: 0,
      ctr: 0,
      viewToStartRate: 0,
      startToPaidRate: 0,
      priceVsPeerMedian: null,
      peerMedianNightCents: null,
      peerSampleSize: 0,
      trafficVolumeScore: 0,
    });
    const r = computeBnhubRankingScore("z", sparse, 0);
    expect(Number.isFinite(r.finalScore)).toBe(true);
  });
});
