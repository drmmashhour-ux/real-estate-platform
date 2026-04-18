import { describe, expect, it, vi, afterEach } from "vitest";
import { assembleGrowthGovernancePolicySnapshot } from "../growth-governance-policy.service";
import type { GrowthGovernanceDecision } from "../growth-governance.types";
import type { GrowthLearningControlDecision } from "../growth-governance-learning.types";

describe("assembleGrowthGovernancePolicySnapshot", () => {
  it("does not mutate inputs", () => {
    const gov: GrowthGovernanceDecision | null = null;
    const lc: GrowthLearningControlDecision | null = null;
    const snap = JSON.stringify({ gov, lc });
    assembleGrowthGovernancePolicySnapshot({
      governance: gov,
      learningControl: lc,
      autopilotExecutionEnabled: false,
      missingDataWarnings: [],
    });
    expect(JSON.stringify({ gov, lc })).toBe(snap);
  });

  it("returns eight domain rules with defaults", () => {
    const s = assembleGrowthGovernancePolicySnapshot({
      governance: null,
      learningControl: null,
      autopilotExecutionEnabled: false,
      missingDataWarnings: [],
    });
    expect(s.rules.length).toBe(8);
    expect(s.rules.find((r) => r.domain === "ads")?.mode).toBe("advisory_only");
    expect(s.reviewRequiredDomains.length).toBeGreaterThan(0);
  });

  it("applies governance frozen domains", () => {
    const governance: GrowthGovernanceDecision = {
      status: "healthy",
      topRisks: [],
      blockedDomains: [],
      frozenDomains: ["ads"],
      humanReviewItems: [],
      humanReviewQueue: [],
      notes: [],
      createdAt: "x",
    };
    const s = assembleGrowthGovernancePolicySnapshot({
      governance,
      learningControl: null,
      autopilotExecutionEnabled: false,
      missingDataWarnings: [],
    });
    expect(s.frozenDomains).toContain("ads");
    expect(s.rules.find((r) => r.domain === "ads")?.mode).toBe("frozen");
  });
});

describe("buildGrowthGovernancePolicySnapshot flag gate", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("returns null when policy flag off", async () => {
    vi.stubEnv("FEATURE_GROWTH_GOVERNANCE_POLICY_V1", "");
    vi.resetModules();
    const { buildGrowthGovernancePolicySnapshot } = await import("../growth-governance-policy.service");
    await expect(buildGrowthGovernancePolicySnapshot()).resolves.toBeNull();
  });
});
