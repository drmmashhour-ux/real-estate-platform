import { describe, expect, it } from "vitest";
import {
  computeShadowListingRank01,
  summarizeRankingV8ShadowDiffs,
} from "./ranking-v8-shadow-evaluator.service";
import type { RankingV8ShadowDiffRow } from "./ranking-v8-shadow.types";

describe("ranking-v8-shadow-evaluator", () => {
  it("computeShadowListingRank01 returns finite 0–1", () => {
    const r = computeShadowListingRank01({ baseScore: 0.5, trustScore: 0.2, performanceScore: 0.3 });
    expect(r).toBeGreaterThanOrEqual(0);
    expect(r).toBeLessThanOrEqual(1);
    expect(Number.isFinite(r)).toBe(true);
  });

  it("summarizeRankingV8ShadowDiffs handles empty deltas", () => {
    const rows: RankingV8ShadowDiffRow[] = [
      {
        listingId: "a",
        liveRankIndex: 0,
        liveScore: 10,
        shadowScore: null,
        delta: null,
        confidence: 0,
        reasons: [],
      },
    ];
    expect(summarizeRankingV8ShadowDiffs(rows)).toEqual({ meanAbsDelta: 0, maxAbsDelta: 0 });
  });

  it("summarizeRankingV8ShadowDiffs aggregates abs deltas", () => {
    const rows: RankingV8ShadowDiffRow[] = [
      {
        listingId: "a",
        liveRankIndex: 0,
        liveScore: 50,
        shadowScore: 55,
        delta: 5,
        confidence: 0.9,
        reasons: [],
      },
      {
        listingId: "b",
        liveRankIndex: 1,
        liveScore: 40,
        shadowScore: 36,
        delta: -4,
        confidence: 0.9,
        reasons: [],
      },
    ];
    const s = summarizeRankingV8ShadowDiffs(rows);
    expect(s.meanAbsDelta).toBe(4.5);
    expect(s.maxAbsDelta).toBe(5);
  });
});
