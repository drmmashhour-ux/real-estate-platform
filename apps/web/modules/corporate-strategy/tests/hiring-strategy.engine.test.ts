import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/legacy", () => ({ getLegacyDB: () => ({ deal: { count: vi.fn().mockResolvedValue(0), groupBy: vi.fn().mockResolvedValue([]) } } }));
vi.mock("@/modules/investor-intelligence/expansion-analysis.engine", () => ({
  evaluateExpansionOpportunities: () => Promise.resolve({ topMarkets: [], topSegments: [], risks: [], capacityNotes: [] }),
}));
vi.mock("@/modules/investor-intelligence/roi-engine.service", () => ({ analyzeRoiPerformance: () => Promise.resolve([]) }));

import { generateHiringStrategy } from "../hiring-strategy.engine";

describe("generateHiringStrategy", () => {
  it("returns roles with rationale when load is not extreme", async () => {
    const h = await generateHiringStrategy();
    expect(h.roles.length).toBeGreaterThan(0);
    expect(h.roles[0]?.rationale.length).toBeGreaterThan(0);
  });
});
