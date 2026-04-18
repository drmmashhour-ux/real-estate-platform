import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  getGrowthGovernanceMonitoringCounters,
  getGrowthGovernanceMonitoringSnapshot,
  recordGrowthGovernanceEvaluation,
  resetGrowthGovernanceMonitoringForTests,
  logGrowthGovernanceEvaluationStarted,
} from "../growth-governance-monitoring.service";
import type { GrowthGovernanceDecision } from "../growth-governance.types";

const mon = vi.hoisted(() => ({ monitoring: true }));

vi.mock("@/config/feature-flags", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/config/feature-flags")>();
  return {
    ...mod,
    growthGovernanceFlags: new Proxy(mod.growthGovernanceFlags, {
      get(target, prop, receiver) {
        if (prop === "growthGovernanceMonitoringV1") return mon.monitoring;
        return Reflect.get(target, prop, receiver);
      },
    }),
  };
});

beforeEach(() => {
  mon.monitoring = true;
  resetGrowthGovernanceMonitoringForTests();
});

describe("growth-governance-monitoring", () => {
  const decision = (status: GrowthGovernanceDecision["status"]): GrowthGovernanceDecision => ({
    status,
    topRisks: [{ id: "1", category: "ads", severity: "low", title: "t", description: "d", reason: "r" }],
    blockedDomains: ["ads"],
    frozenDomains: [],
    humanReviewItems: [],
    humanReviewQueue: [],
    notes: [],
    createdAt: "2026-04-02T12:00:00.000Z",
  });

  it("increments counters when monitoring on", () => {
    recordGrowthGovernanceEvaluation({
      decision: decision("watch"),
      governanceWarnings: ["missing"],
      reviewQueueSize: 2,
      blockedCount: 1,
      frozenCount: 0,
    });
    const c = getGrowthGovernanceMonitoringSnapshot();
    expect(c.evaluationsCount).toBe(1);
    expect(c.watchCount).toBe(1);
    expect(c.missingSignalWarnings).toBeGreaterThan(0);
    expect(getGrowthGovernanceMonitoringCounters().evaluationsCount).toBe(1);
  });

  it("skips logs and counter bumps when monitoring off", () => {
    mon.monitoring = false;
    const before = getGrowthGovernanceMonitoringSnapshot().evaluationsCount;
    logGrowthGovernanceEvaluationStarted();
    recordGrowthGovernanceEvaluation({
      decision: decision("healthy"),
      governanceWarnings: [],
      reviewQueueSize: 0,
      blockedCount: 0,
      frozenCount: 0,
    });
    expect(getGrowthGovernanceMonitoringSnapshot().evaluationsCount).toBe(before);
  });
});
