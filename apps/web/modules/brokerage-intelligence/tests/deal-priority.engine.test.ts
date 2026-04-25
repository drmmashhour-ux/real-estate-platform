import { describe, expect, it } from "vitest";
import { computeDealPriority } from "../deal-priority.engine";
import type { DealPortfolioSlice } from "../brokerage-intelligence.types";

const base: DealPortfolioSlice = {
  id: "d1",
  priceCents: 400_000_00,
  status: "offer_submitted",
  lastUpdatedAt: new Date(),
  crmStage: "negotiation",
};

describe("computeDealPriority", () => {
  it("returns 0-100 and structured levels", () => {
    const r = computeDealPriority(base);
    expect(r.priorityScore).toBeGreaterThanOrEqual(0);
    expect(r.priorityScore).toBeLessThanOrEqual(100);
    expect(["low", "medium", "high"]).toContain(r.riskLevel);
    expect(["low", "medium", "high"]).toContain(r.urgencyLevel);
  });

});
