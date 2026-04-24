import { describe, it, expect, vi, beforeEach } from "vitest";
import { cohortBucket0To99, isEntityInRollout } from "../rollout-cohort.service";
import { getNextLadderPercent } from "../rollout-policy.service";
import { evaluateRollout } from "../rollout-evaluator.service";
import { prisma } from "@/lib/db";

vi.mock("@/lib/db", () => ({
  prisma: {
    rolloutMetricSnapshot: {
      findMany: vi.fn(),
    },
    rolloutPolicy: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    rolloutExecution: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((ops: unknown[]) => Promise.all(ops as Promise<unknown>[])),
  },
}));

describe("rollout cohort", () => {
  it("is deterministic for same entity and cohort salt", () => {
    expect(cohortBucket0To99("user-1", "salt-a")).toBe(cohortBucket0To99("user-1", "salt-a"));
  });

  it("respects rollout percent threshold", () => {
    const salt = "cohort-test";
    const id = "stable-entity";
    const b = cohortBucket0To99(id, salt);
    expect(isEntityInRollout(id, b, salt)).toBe(false);
    expect(isEntityInRollout(id, b + 1, salt)).toBe(true);
  });

  it("never excludes at 100% (gradual cap allows full exposure only after ladder)", () => {
    expect(isEntityInRollout("any", 100, "x")).toBe(true);
  });
});

describe("rollout ladder", () => {
  it("steps gradually without instant 100 from low bases", () => {
    expect(getNextLadderPercent(5)).toBe(10);
    expect(getNextLadderPercent(0)).toBe(5);
    expect(getNextLadderPercent(100)).toBe(100);
  });
});

describe("rollout evaluator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("detects improvement when composite rises", async () => {
    const base = {
      conversionRate: 0.1,
      revenuePerUser: 0,
      engagementScore: 0.2,
      dealSuccessRate: 0.3,
    };
    const better = {
      conversionRate: 0.12,
      revenuePerUser: 0.01,
      engagementScore: 0.25,
      dealSuccessRate: 0.35,
    };
    (prisma.rolloutMetricSnapshot.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { metricsJson: base },
      { metricsJson: better },
    ]);
    const r = await evaluateRollout("ex1");
    expect(r.verdict).toBe("IMPROVE");
    expect(r.improvementPct).toBeGreaterThan(0);
  });

  it("returns neutral with insufficient snapshots", async () => {
    (prisma.rolloutMetricSnapshot.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { metricsJson: {} },
    ]);
    const r = await evaluateRollout("ex2");
    expect(r.verdict).toBe("NEUTRAL");
  });
});
