import { describe, expect, it } from "vitest";

/** Mirrors server ordering intent for patterns list (confidence desc default). */
function comparePatterns(
  a: { confidence: number; impactScore: number },
  b: { confidence: number; impactScore: number },
  sortBy: "confidence" | "impactScore"
): number {
  const av = sortBy === "confidence" ? a.confidence : a.impactScore;
  const bv = sortBy === "confidence" ? b.confidence : b.impactScore;
  return bv - av;
}

describe("learning dashboard ordering helpers", () => {
  it("sorts by confidence descending when requested", () => {
    const rows = [
      { confidence: 0.5, impactScore: 0.9 },
      { confidence: 0.9, impactScore: 0.2 },
    ];
    const sorted = [...rows].sort((a, b) => comparePatterns(a, b, "confidence"));
    expect(sorted[0].confidence).toBe(0.9);
  });

  it("filters by minimum sample size conceptually", () => {
    const rows = [{ sampleSize: 5 }, { sampleSize: 30 }];
    const min = 10;
    expect(rows.filter((r) => r.sampleSize >= min)).toHaveLength(1);
  });
});
