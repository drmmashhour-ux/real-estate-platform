import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    platformCoreDecisionSchedule: { count: vi.fn().mockResolvedValue(0) },
    platformCoreDecisionDependency: { count: vi.fn().mockResolvedValue(0) },
  },
}));

vi.mock("@/modules/platform-core/brain-v8-shadow-comparison.service", () => ({
  getLastBrainV8ComparisonReport: vi.fn().mockReturnValue(null),
}));

vi.mock("@/modules/platform-core/brain-v8-shadow-monitoring.service", () => ({
  getBrainV8ShadowMonitoringSnapshot: vi.fn().mockReturnValue({
    passesRun: 0,
    persistSuccess: 0,
    persistFail: 0,
    emptySamplePasses: 0,
    auditEmitFail: 0,
    snapshotFail: 0,
    consecutiveEmptyPasses: 0,
  }),
}));

vi.mock("@/modules/platform-core/brain-v8-primary-monitoring.service", () => ({
  getBrainV8PrimaryMonitoringSnapshot: vi.fn().mockReturnValue({
    v8PrimarySuccessCount: 0,
    v8PrimaryFallbackCount: 0,
    recentPrimaryFallbackReasons: [],
    lastPrimaryPathLabel: null,
    postCutover: undefined,
  }),
}));

vi.mock("@/modules/ai-autopilot/actions/ads-automation-loop.autopilot.adapter.comparison", () => ({
  getAdsV8ComparisonAggregationSnapshot: vi.fn().mockReturnValue({
    runs: 0,
    avgOverlapRate: null,
    avgDivergenceRate: null,
    pctRunsHeuristicAligned: null,
    pctRunsRisky: null,
  }),
}));

vi.mock("@/modules/ranking/ranking-v8-governance.service", () => ({
  loadRankingV8GovernancePayload: vi.fn().mockResolvedValue({
    scorecard: {
      totalScore: 10,
      maxScore: 25,
      categoryScores: { quality: 2, stability: 2, userImpact: 2, safety: 2, coverage: 2 },
      decision: "not_ready",
    },
    rollout: {
      currentPhase: "shadow_only",
      recommendation: "stay_in_shadow",
      targetPhase: null,
      readiness: {
        qualityReady: false,
        stabilityReady: false,
        safetyReady: false,
        coverageReady: false,
        userImpactReady: false,
        userImpactNa: true,
      },
      blockingReasons: [],
      warnings: [],
    },
    metrics: {
      top5Overlap: 0.5,
      top10Overlap: 0.5,
      avgRankShift: 1,
      top5ChurnRate: null,
      repeatConsistency: null,
      largeJumpRate: null,
      ctrDelta: null,
      saveDelta: null,
      leadDelta: null,
    },
    coverage: {},
    rollbackSignals: {
      severeOverlapDrop: false,
      instabilitySpike: false,
      errorPresent: false,
      negativeUserImpact: false,
    },
    history: [],
    meta: { dataFreshnessMs: 1, sourcesUsed: [], missingSources: [], queryFingerprintLatest: null },
  }),
}));

vi.mock("@/modules/platform-core/platform-health.service", () => ({
  getPlatformCoreHealth: vi.fn().mockResolvedValue({
    pendingDecisions: 0,
    blockedDecisions: 0,
    failedTasks: 0,
    runningTasks: 0,
    queuedTasks: 0,
    recentAuditCount: 0,
    warnings: [],
  }),
}));

vi.mock("@/modules/autonomous-growth/autonomous-growth.repository", () => ({
  listRecentAutonomousRuns: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/modules/fusion/fusion-system.service", () => ({
  buildFusionSnapshotV1: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/services/growth/cro-v8-optimization-bridge", () => ({
  runCroV8OptimizationBundle: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/config/feature-flags", async (importOriginal) => {
  const a = await importOriginal<typeof import("@/config/feature-flags")>();
  return {
    ...a,
    oneBrainV8Flags: { ...a.oneBrainV8Flags, brainV8ShadowObservationV1: false, brainV8InfluenceV1: false, brainV8PrimaryV1: false },
    croOptimizationV8Flags: { ...a.croOptimizationV8Flags, croV8AnalysisV1: false },
  };
});

import { loadAiControlCenterPayload } from "./ai-control-center.service";

describe("loadAiControlCenterPayload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns assembled payload without throwing", async () => {
    const p = await loadAiControlCenterPayload({ days: 7, limit: 5 });
    expect(p.systems.brain).toBeDefined();
    expect(p.systems.ads).toBeDefined();
    expect(p.executiveSummary.overallStatus).toMatch(/healthy|limited|warning|critical/);
    expect(p.meta.sourcesUsed.length).toBeGreaterThan(0);
  });

  it("includes rollout summary lists", async () => {
    const p = await loadAiControlCenterPayload({});
    expect(Array.isArray(p.rolloutSummary.shadowSystems)).toBe(true);
  });
});
