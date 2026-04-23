import { describe, expect, it, vi, beforeEach } from "vitest";

import { buildAutonomousBrainSummary } from "../autonomous-brain-summary.service";

vi.mock("@/lib/db", () => ({
  prisma: {
    learningPattern: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: "lp1",
          pattern: "test",
          confidence: 0.8,
          impactScore: 0.7,
          sampleSize: 12,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]),
    },
    investmentOpportunity: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: "io1",
          listingId: "l1",
          score: 80,
          expectedROI: 0.11,
          riskLevel: "MEDIUM",
          recommendedInvestmentMajor: 50,
          rationaleJson: { summary: "ok" },
          createdAt: new Date(),
          listing: { title: "Home" },
        },
      ]),
    },
    autonomyDecision: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: "ad1",
          domain: "MATCHING",
          action: "adjust_weights",
          rationale: "because",
          confidence: 0.75,
          impactEstimate: 0.4,
          requiresApproval: true,
          status: "PROPOSED",
          payloadJson: { kind: "adjust_matching_weights" },
          baselineMetricsJson: {},
          createdAt: new Date(),
          approvedAt: null,
          appliedAt: null,
          approvedByUserId: null,
        },
      ]),
    },
  },
}));

describe("autonomous brain summary aggregation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns merged sections with advisory copy and marketplace counts", async () => {
    const s = await buildAutonomousBrainSummary();
    expect(s.advisoryBanner.length).toBeGreaterThan(10);
    expect(s.learning.patterns.length).toBeGreaterThan(0);
    expect(s.investment.opportunities.length).toBeGreaterThan(0);
    expect(s.marketplace.counts.proposed).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(s.priorities)).toBe(true);
    expect(s.outcomes.summary.implementedCount).toBeGreaterThanOrEqual(0);
  });
});
