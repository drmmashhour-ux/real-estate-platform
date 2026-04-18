import { describe, expect, it } from "vitest";
import {
  compareRankingV8LiveVsShadow,
  deriveShadowOrderFromShadowRows,
} from "./ranking-v8-comparison.service";
import type { RankingV8ShadowDiffRow } from "./ranking-v8-shadow.types";

describe("compareRankingV8LiveVsShadow", () => {
  it("identical rankings → perfect overlap and tau ≈ 1", () => {
    const ids = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const r = compareRankingV8LiveVsShadow({ liveOrderedIds: ids, shadowOrderedIds: [...ids] });
    expect(r.comparedCount).toBe(8);
    expect(r.overlapTop3).toBe(3);
    expect(r.overlapTop5).toBe(5);
    expect(r.overlapTop10).toBe(8);
    expect(r.avgRankShift).toBe(0);
    expect(r.maxAbsRankShift).toBe(0);
    expect(r.summary.majorMovements).toBe(0);
    expect(r.kendallTauLike).toBe(1);
    expect(r.summary.stabilityScore).toBeGreaterThan(0.95);
    expect(r.qualitySignals.orderingInstabilityHint).toBe(false);
  });

  it("reversed rankings → disjoint top-3/5 and negative Kendall-like correlation", () => {
    const live = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"];
    const shadow = [...live].reverse();
    const r = compareRankingV8LiveVsShadow({ liveOrderedIds: live, shadowOrderedIds: shadow });
    expect(r.overlapTop3).toBe(0);
    expect(r.overlapTop5).toBe(0);
    expect(r.kendallTauLike).toBeLessThan(-0.45);
    expect(r.avgRankShift).toBeGreaterThan(4);
    expect(r.qualitySignals.orderingInstabilityHint).toBe(true);
  });

  it("partial overlap: small reorder lowers top-3 set overlap but keeps top-5", () => {
    const live = ["a", "b", "c", "d", "e"];
    const shadow = ["a", "b", "d", "c", "e"];
    const r = compareRankingV8LiveVsShadow({ liveOrderedIds: live, shadowOrderedIds: shadow });
    expect(r.overlapTop3).toBe(2);
    expect(r.overlapTop5).toBe(5);
    expect(r.avgRankShift).toBeLessThan(1.5);
    expect(r.summary.majorMovements).toBe(0);
    expect(r.kendallTauLike).toBeGreaterThan(0.75);
  });

  it("restricts to intersection when shadow omits tail ids", () => {
    const live = ["a", "b", "c", "d", "e"];
    const shadow = ["c", "b", "a"];
    const r = compareRankingV8LiveVsShadow({ liveOrderedIds: live, shadowOrderedIds: shadow });
    expect(r.comparedCount).toBe(3);
    expect(r.perListing.map((p) => p.listingId).join(",")).toBe("a,b,c");
  });
});

describe("deriveShadowOrderFromShadowRows", () => {
  it("orders by shadow score descending", () => {
    const rows: RankingV8ShadowDiffRow[] = [
      {
        listingId: "x",
        liveRankIndex: 0,
        liveScore: 50,
        shadowScore: 40,
        delta: -10,
        confidence: 0.5,
        reasons: [],
      },
      {
        listingId: "y",
        liveRankIndex: 1,
        liveScore: 40,
        shadowScore: 90,
        delta: 50,
        confidence: 0.5,
        reasons: [],
      },
      {
        listingId: "z",
        liveRankIndex: 2,
        liveScore: 30,
        shadowScore: null,
        delta: null,
        confidence: 0,
        reasons: [],
      },
    ];
    expect(deriveShadowOrderFromShadowRows(rows)).toEqual(["y", "x", "z"]);
  });
});
