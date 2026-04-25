import { describe, expect, it, vi } from "vitest";

const findManyS = vi.fn();

vi.mock("@repo/db", () => ({
  prisma: {
    segmentPerformanceAggregate: { findMany: (...a: unknown[]) => findManyS(...a) },
  },
}));

import { analyzeSegmentPerformance } from "../segment-intelligence.service";

describe("analyzeSegmentPerformance", () => {
  it("returns best/weak with empty data", async () => {
    findManyS.mockResolvedValue([
      { segmentKey: "a|b", totalDeals: 5, wins: 1, losses: 4, winRate: 0.2, avgClosingTime: 40 },
    ]);
    const s = await analyzeSegmentPerformance();
    expect(s.bySegment).toHaveLength(1);
    expect(s.rationale[0]!.toLowerCase()).toContain("segment");
  });
});
