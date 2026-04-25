import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/config/feature-flags", () => ({
  engineFlags: { brokerageIntelligenceV1: true },
}));
vi.mock("@repo/db", () => ({
  prisma: {
    portfolioSnapshot: { create: vi.fn().mockResolvedValue({ id: "snap" }) },
  },
}));
vi.mock("../broker-load.service", () => ({
  computeBrokerLoadMetrics: vi.fn().mockResolvedValue([{ brokerId: "b1", activeDeals: 0, activeLeads: 0, avgResponseTime: null, workloadScore: 90 }]),
  recommendLoadRebalancing: vi.fn().mockResolvedValue({ suggestions: [], rationale: [] }),
}));
vi.mock("../segment-intelligence.service", () => ({
  analyzeSegmentPerformance: vi.fn().mockResolvedValue({
    best: [],
    weak: [],
    bySegment: [],
    rationale: [],
  }),
}));
vi.mock("../lead-routing.engine", () => ({
  recommendBrokerForLead: vi.fn().mockResolvedValue({
    recommendedBrokerId: "x",
    alternatives: [],
    rationale: ["ok"],
    contextBucket: "ctx",
  }),
}));

import { runPortfolioAnalysis } from "../brokerage-intelligence.engine";
import { touchStrategyBenchmarkHint } from "../brokerage-intelligence.integrations";

describe("runPortfolioAnalysis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns alerts for overloaded brokers", async () => {
    const a = await runPortfolioAnalysis({ leadSamples: [], dealSamples: [] });
    expect(a.brokerLoadInsights[0]!.workloadScore).toBe(90);
    expect(a.alerts.some((x) => x.toLowerCase().includes("load"))).toBe(true);
  });
});

describe("integration hint", () => {
  it("is safe no-op", () => {
    touchStrategyBenchmarkHint("test");
  });
});
