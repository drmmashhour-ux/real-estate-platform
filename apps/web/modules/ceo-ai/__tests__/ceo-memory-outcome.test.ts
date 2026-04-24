import { describe, it, expect, vi, beforeEach } from "vitest";
import { recordCeoDecisionMemory } from "../ceo-memory.service";
import { trackCeoOutcomes } from "../ceo-outcome-tracker.service";
import { prisma } from "@/lib/db";
import { CeoDataAggregatorService } from "../ceo-data-aggregator.service";
import { gatherMarketSignals } from "../ceo-market-signals.service";

vi.mock("../ceo-market-signals.service", () => ({
  gatherMarketSignals: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    ceoDecisionMemory: {
      upsert: vi.fn(),
      findMany: vi.fn(),
    },
    ceoDecisionOutcome: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/server/launch-logger", () => ({
  logCeoMemoryTagged: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("CEO memory + outcomes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CEO_OUTCOME_MIN_AGE_HOURS = "0";
  });

  it("stores strategic decision memory with metrics snapshot (upsert)", async () => {
    (prisma.ceoDecisionMemory.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await recordCeoDecisionMemory(
      {
        id: "dec-1",
        decisionType: "INVEST",
        domain: "MARKETING",
        payloadJson: { x: 1 },
        reasoning: "test",
        confidence: 0.9,
        createdAt: new Date("2024-01-01"),
        insightIds: [],
      },
      "abc123fingerprint000",
      { growthTrend: 0.1, dealsCloseRate: 0.2 },
    );

    expect(prisma.ceoDecisionMemory.upsert).toHaveBeenCalledTimes(1);
    const call = (prisma.ceoDecisionMemory.upsert as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.create.payloadJson).toMatchObject({
      source: "strategic_ceo",
      metricsSnapshot: { growthTrend: 0.1, dealsCloseRate: 0.2 },
    });
  });

  it("computes outcome from overlapping metrics and records once", async () => {
    const old = new Date(Date.now() - 48 * 3600_000);
    (prisma.ceoDecisionMemory.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: "m1",
        createdAt: old,
        payloadJson: {
          metricsSnapshot: { growthTrend: 0.1, dealsCloseRate: 0.2 },
        },
      },
    ]);
    (prisma.ceoDecisionOutcome.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.ceoDecisionOutcome.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "o1" });

    vi.spyOn(CeoDataAggregatorService, "buildCeoContext").mockResolvedValue({
      growth: { leadsCount: 1, conversionRate: 0, trafficVolume: 0, trend: 0.25 },
      deals: { volume: 0, closeRate: 0.3, stageDistribution: {}, avgRejectionRate: 0 },
      esg: { avgScore: 0, upgradeActivity: 0, adoptionRate: 0 },
      rollout: { activeCount: 0, successRate: 0, failureSignals: [] },
      agents: { decisionsCount: 0, successSignals: 0, activeAgents: 0 },
      revenue: {},
      timestamp: new Date(),
    } as any);
    vi.mocked(gatherMarketSignals).mockResolvedValue({
      leadsLast30d: 10,
      leadsPrev30d: 10,
      seniorConversionRate30d: 0,
      operatorsWithResidences: 0,
      brokerAccountsApprox: 0,
      operatorOnboardedLast90d: 0,
      brokersJoinedLast90d: 0,
      churnInactiveBrokersApprox: 0,
      inactiveOperatorsApprox: 0,
      demandIndex: 0,
      outreachReplyRateProxy: null,
      seoPagesIndexedApprox: 0,
      emailEngagementScore: null,
      avgLeadQualityScore: null,
      revenueTrend30dProxy: 0,
      activeDealsCount: 0,
      dealPipelineHealth: 0.5,
      esgActivityLevel: 0,
    } as any);

    const r = await trackCeoOutcomes();
    expect(r.processed).toBe(1);
    expect(prisma.ceoDecisionOutcome.create).toHaveBeenCalledTimes(1);
    const data = (prisma.ceoDecisionOutcome.create as ReturnType<typeof vi.fn>).mock.calls[0][0].data;
    expect(data.resultLabel).toBe("POSITIVE");
    expect(data.impactScore).toBeGreaterThan(0);
  });

  it("skips duplicate outcomes (existing row)", async () => {
    const old = new Date(Date.now() - 48 * 3600_000);
    (prisma.ceoDecisionMemory.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: "m2", createdAt: old, payloadJson: { metricsSnapshot: { growthTrend: 1 } } },
    ]);
    (prisma.ceoDecisionOutcome.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "existing" });

    vi.spyOn(CeoDataAggregatorService, "buildCeoContext").mockResolvedValue(null as any);
    vi.mocked(gatherMarketSignals).mockResolvedValue(null as any);

    const r = await trackCeoOutcomes();
    expect(r.skipped).toBe(1);
    expect(prisma.ceoDecisionOutcome.create).not.toHaveBeenCalled();
  });

  it("handles missing before metrics safely (NEUTRAL, no fabricated directional label)", async () => {
    const old = new Date(Date.now() - 48 * 3600_000);
    (prisma.ceoDecisionMemory.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: "m3", createdAt: old, payloadJson: { noSnapshot: true } },
    ]);
    (prisma.ceoDecisionOutcome.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.ceoDecisionOutcome.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "o3" });

    vi.spyOn(CeoDataAggregatorService, "buildCeoContext").mockResolvedValue(null as any);
    vi.mocked(gatherMarketSignals).mockResolvedValue(null as any);

    await trackCeoOutcomes();
    const data = (prisma.ceoDecisionOutcome.create as ReturnType<typeof vi.fn>).mock.calls[0][0].data;
    expect(data.resultLabel).toBe("NEUTRAL");
    expect(data.impactScore).toBe(0);
  });
});
