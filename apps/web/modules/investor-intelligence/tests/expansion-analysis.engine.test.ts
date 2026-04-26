import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/legacy", () => ({
  getLegacyDB: () => ({ deal: { count: vi.fn().mockResolvedValue(10) } }),
}));
vi.mock("../roi-engine.service", () => ({
  analyzeRoiPerformance: vi.fn().mockResolvedValue([]),
}));

import { evaluateExpansionOpportunities } from "../expansion-analysis.engine";

describe("evaluateExpansionOpportunities", () => {
  it("returns shape without throw", async () => {
    const e = await evaluateExpansionOpportunities();
    expect(Array.isArray(e.topMarkets)).toBe(true);
    expect(Array.isArray(e.risks)).toBe(true);
  });
});
