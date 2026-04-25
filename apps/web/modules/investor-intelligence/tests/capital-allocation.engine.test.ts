import { describe, expect, it, vi } from "vitest";

vi.mock("../roi-engine.service", () => ({
  analyzeRoiPerformance: vi.fn().mockResolvedValue([
    {
      scopeType: "MARKET",
      scopeKey: "QC",
      revenue: 1000,
      wonDeals: 2,
      lostDeals: 0,
      avgDealCycleDays: 10,
      estimatedLeadSpend: 100,
      roiScore: 0.7,
      efficiencyScore: 0.8,
      trace: ["a"],
    },
  ]),
}));

import { generateCapitalAllocationRecommendations } from "../capital-allocation.engine";

describe("generateCapitalAllocationRecommendations", () => {
  it("returns at least one allocation view", async () => {
    const r = await generateCapitalAllocationRecommendations();
    expect(r.length).toBeGreaterThan(0);
    expect(r[0]!.rationale.length).toBeGreaterThan(0);
  });
});
