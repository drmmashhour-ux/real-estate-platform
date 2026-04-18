import { describe, expect, it } from "vitest";
import { compareRankingV8LiveVsShadow } from "./ranking-v8-comparison.service";
import {
  applyRankingV8Influence,
  RANKING_V8_INFLUENCE_MAX_SWAPS_PER_LISTING,
  RANKING_V8_INFLUENCE_TOP_ZONE,
} from "./ranking-v8-influence.service";
import type { RankingV8ComparisonResult } from "./ranking-v8-comparison.types";
import type { RankingV8ShadowDiffRow } from "./ranking-v8-shadow.types";

function mkRow(
  listingId: string,
  liveRankIndex: number,
  liveScore: number,
  shadowScore: number,
): RankingV8ShadowDiffRow {
  const delta = shadowScore - liveScore;
  return {
    listingId,
    liveRankIndex,
    liveScore,
    shadowScore,
    delta,
    confidence: 0.8,
    reasons: [],
  };
}

describe("applyRankingV8Influence", () => {
  it("returns identical order when quality gates fail (small result set)", () => {
    const live = Array.from({ length: 5 }, (_, i) => ({
      listing: { id: `x${i}` },
      rankingScore: 100 - i,
    }));
    const rows: RankingV8ShadowDiffRow[] = live.map((l, i) =>
      mkRow(l.listing.id, i, 50, 50),
    );
    const comp = compareRankingV8LiveVsShadow({
      liveOrderedIds: live.map((l) => l.listing.id),
      shadowOrderedIds: live.map((l) => l.listing.id),
    });
    const r = applyRankingV8Influence({ liveSorted: live, shadowRows: rows, comparison: comp });
    expect(r.skippedReason).toBe("small_result_set");
    expect(r.output.map((x) => x.listing.id)).toEqual(live.map((x) => x.listing.id));
  });

  it("keeps identical rankings stable when gates pass", () => {
    const ids = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"];
    const live = ids.map((id, i) => ({ listing: { id }, rankingScore: 100 - i }));
    const rows = ids.map((id, i) => mkRow(id, i, 80 - i * 0.5, 80 - i * 0.5));
    const comp = compareRankingV8LiveVsShadow({ liveOrderedIds: ids, shadowOrderedIds: ids });
    const r = applyRankingV8Influence({ liveSorted: live, shadowRows: rows, comparison: comp });
    expect(r.applied).toBe(false);
    expect(r.output.map((x) => x.listing.id)).toEqual(ids);
  });

  it("may apply bounded adjacent boost when shadow strongly prefers neighbor", () => {
    const ids = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"];
    const live = ids.map((id, i) => ({ listing: { id }, rankingScore: 100 - i }));
    const rows = ids.map((id, i) => {
      if (id === "a") return mkRow("a", 0, 70, 65);
      if (id === "b") return mkRow("b", 1, 60, 95);
      return mkRow(id, i, 80 - i, 80 - i);
    });
    const shadowOrder = ["b", "a", ...ids.slice(2)];
    const comp = compareRankingV8LiveVsShadow({ liveOrderedIds: ids, shadowOrderedIds: shadowOrder });
    const r = applyRankingV8Influence({ liveSorted: live, shadowRows: rows, comparison: comp });
    expect(r.output.length).toBe(live.length);
    expect(new Set(r.output.map((x) => x.listing.id)).size).toBe(ids.length);
    if (r.applied) {
      expect(r.boostsApplied + r.downranksApplied).toBeLessThanOrEqual(
        RANKING_V8_INFLUENCE_TOP_ZONE * RANKING_V8_INFLUENCE_MAX_SWAPS_PER_LISTING,
      );
    }
  });

  it("monitor-only path when instability is high and stability is low", () => {
    const ids = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"];
    const live = ids.map((id, i) => ({ listing: { id }, rankingScore: 100 - i }));
    const rows = ids.map((id, i) => mkRow(id, i, 50, 50));
    const base = compareRankingV8LiveVsShadow({ liveOrderedIds: ids, shadowOrderedIds: ids });
    const comp: RankingV8ComparisonResult = {
      ...base,
      qualitySignals: {
        ...base.qualitySignals,
        orderingInstabilityHint: true,
      },
      summary: {
        ...base.summary,
        stabilityScore: 0.45,
      },
    };
    const r = applyRankingV8Influence({ liveSorted: live, shadowRows: rows, comparison: comp });
    expect(r.monitorOnly).toBe(true);
    expect(r.output.map((x) => x.listing.id)).toEqual(ids);
  });

  it("skips when malformed diff rate is high", () => {
    const ids = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"];
    const live = ids.map((id, i) => ({ listing: { id }, rankingScore: 100 - i }));
    const rows: RankingV8ShadowDiffRow[] = ids.map((id, i) =>
      i % 2 === 0
        ? { ...mkRow(id, i, 50, 50), shadowScore: null, delta: null }
        : mkRow(id, i, 50, 50),
    );
    const comp = compareRankingV8LiveVsShadow({ liveOrderedIds: ids, shadowOrderedIds: ids });
    const r = applyRankingV8Influence({ liveSorted: live, shadowRows: rows, comparison: comp });
    expect(r.skippedReason).toBe("high_malformed_diff_rate");
  });
});
