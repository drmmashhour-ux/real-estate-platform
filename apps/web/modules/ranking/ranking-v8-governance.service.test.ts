import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    rankingShadowObservation: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/config/feature-flags", async (importOriginal) => {
  const a = await importOriginal<typeof import("@/config/feature-flags")>();
  return {
    ...a,
    rankingV8ShadowFlags: {
      ...a.rankingV8ShadowFlags,
      rankingV8ShadowEvaluatorV1: true,
      rankingV8ShadowPersistenceV1: false,
      rankingV8InfluenceV1: false,
      rankingV8ValidationScoringV1: true,
      rankingV8ValidationScoringPersistenceV1: false,
      rankingV8GovernanceDashboardV1: true,
    },
  };
});

import { prisma } from "@/lib/db";
import { loadRankingV8GovernancePayload } from "./ranking-v8-governance.service";

function row(id: string, liveIdx: number, shadow: number): {
  listingId: string;
  liveRankIndex: number;
  liveScore: number;
  shadowScore: number;
  delta: number;
  confidence: number;
  reasons: string[];
} {
  return {
    listingId: id,
    liveRankIndex: liveIdx,
    liveScore: 50,
    shadowScore: shadow,
    delta: shadow - 50,
    confidence: 0.9,
    reasons: [],
  };
}

function summaryPayload(rows: ReturnType<typeof row>[]) {
  return {
    evaluatedAt: new Date().toISOString(),
    queryFingerprint: "qfp-test",
    listingCount: rows.length,
    cappedTo: rows.length,
    rows,
    aggregate: { meanAbsDelta: 1, maxAbsDelta: 2 },
  };
}

describe("loadRankingV8GovernancePayload", () => {
  beforeEach(() => {
    vi.mocked(prisma.rankingShadowObservation.findMany).mockReset();
  });

  it("assembles full payload when observations exist", async () => {
    const r = [row("a", 0, 88), row("b", 1, 77), row("c", 2, 66), row("d", 3, 55), row("e", 4, 44)];
    const p1 = summaryPayload(r);
    vi.mocked(prisma.rankingShadowObservation.findMany).mockResolvedValue([
      { payload: p1, createdAt: new Date("2026-01-15T12:00:00Z") },
      { payload: p1, createdAt: new Date("2026-01-14T12:00:00Z") },
    ]);

    const out = await loadRankingV8GovernancePayload({ days: 7, limit: 5 });
    expect(out.scorecard.maxScore).toBe(25);
    expect(out.scorecard.totalScore).toBeGreaterThan(0);
    expect(out.metrics.top5Overlap).not.toBeNull();
    expect(out.rollout.recommendation).toBeDefined();
    expect(out.history.length).toBeGreaterThan(0);
    expect(out.meta.sourcesUsed).toContain("ranking_shadow_observations");
  });

  it("returns partial payload with missingSources when DB empty", async () => {
    vi.mocked(prisma.rankingShadowObservation.findMany).mockResolvedValue([]);
    const out = await loadRankingV8GovernancePayload({});
    expect(out.meta.missingSources.length).toBeGreaterThan(0);
    expect(out.metrics.top5Overlap).toBeNull();
  });

  it("maps rollback signals from overlap and malformed rows", async () => {
    const bad = [
      row("a", 0, 88),
      { ...row("b", 1, 77), shadowScore: null as unknown as number },
    ];
    const p1 = summaryPayload(bad);
    vi.mocked(prisma.rankingShadowObservation.findMany).mockResolvedValue([
      { payload: p1, createdAt: new Date() },
    ]);
    const out = await loadRankingV8GovernancePayload({ limit: 3 });
    expect(out.rollbackSignals.errorPresent).toBe(true);
  });

  it("does not throw on malformed observation payload", async () => {
    vi.mocked(prisma.rankingShadowObservation.findMany).mockResolvedValue([
      { payload: { notRows: true }, createdAt: new Date() },
    ]);
    const out = await loadRankingV8GovernancePayload({});
    expect(out.scorecard.decision).toBeDefined();
  });

  it("readiness gates reflect scorecard advisory", async () => {
    const r = [row("a", 0, 88), row("b", 1, 77), row("c", 2, 66), row("d", 3, 55), row("e", 4, 44)];
    vi.mocked(prisma.rankingShadowObservation.findMany).mockResolvedValue([
      { payload: summaryPayload(r), createdAt: new Date() },
    ]);
    const out = await loadRankingV8GovernancePayload({});
    expect(typeof out.rollout.readiness.qualityReady).toBe("boolean");
    expect(typeof out.rollout.readiness.userImpactNa).toBe("boolean");
  });
});
