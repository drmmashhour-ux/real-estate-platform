import { describe, expect, it } from "vitest";
import { sortByScoreDesc, weightedScore } from "@/src/modules/ai-selection-engine/infrastructure/selectionRankingService";

describe("selectionRankingService", () => {
  it("computes weighted score deterministically", () => {
    const input = [
      { value: 80, weight: 0.5 },
      { value: 60, weight: 0.3 },
      { value: 40, weight: 0.2 },
    ];
    expect(weightedScore(input)).toBe(66);
    expect(weightedScore(input)).toBe(66);
  });

  it("sorts by score descending", () => {
    const rows = sortByScoreDesc([{ score: 30 }, { score: 80 }, { score: 50 }]);
    expect(rows.map((x) => x.score)).toEqual([80, 50, 30]);
  });
});
