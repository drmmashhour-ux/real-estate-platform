import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/config/feature-flags", () => ({ engineFlags: { brokerageIntelligenceV1: true, investorIntelligenceV1: false } }));
vi.mock("@/lib/db/legacy", () => ({
  getLegacyDB: () => ({
    deal: { count: vi.fn().mockResolvedValue(0), findMany: vi.fn().mockResolvedValue([]) },
    lead: { aggregate: vi.fn().mockResolvedValue({ _sum: { dynamicLeadPriceCents: null } }) },
    investorSnapshot: { create: vi.fn() },
  })
}));
vi.mock("../roi-engine.service", () => ({
  analyzeRoiPerformance: vi.fn().mockResolvedValue([]),
}));
vi.mock("../capital-allocation.engine", () => ({
  generateCapitalAllocationRecommendations: vi.fn().mockResolvedValue([]),
}));
vi.mock("../expansion-analysis.engine", () => ({
  evaluateExpansionOpportunities: vi.fn().mockResolvedValue({ topMarkets: [], topSegments: [], risks: [], capacityNotes: [] }),
}));
vi.mock("../investor-alerts.service", () => ({ buildInvestorAlerts: vi.fn().mockResolvedValue([]) }));

import { buildInvestorSnapshot } from "../investor-snapshot.service";

describe("buildInvestorSnapshot", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns bundle with no throw when no ROI rows (maintain rec)", async () => {
    const b = await buildInvestorSnapshot("t", { writeDb: false });
    expect(b.periodKey).toBe("t");
    expect(b.capitalAllocationJson).toBeDefined();
  });
});
