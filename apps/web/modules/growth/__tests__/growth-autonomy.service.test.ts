import { describe, it, expect, vi, beforeEach } from "vitest";
import { resetGrowthAutonomyMonitoringForTests } from "../growth-autonomy-monitoring.service";

const autonomyFlags = vi.hoisted(() => ({ v1: true, kill: false, enf: true }));
const modeParsed = vi.hoisted(() => ({ mode: "ASSIST" as "OFF" | "ASSIST" | "SAFE_AUTOPILOT" }));
const rolloutParsed = vi.hoisted(() => ({ stage: "partial" as "off" | "internal" | "partial" | "full" }));

const buildEnf = vi.fn(async () => ({
  rules: [
    {
      id: "r1",
      target: "strategy_recommendation_promotion" as const,
      mode: "allow" as const,
      rationale: "ok",
      source: "policy_snapshot" as const,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  ],
  blockedTargets: [] as const,
  frozenTargets: [],
  approvalRequiredTargets: [],
  notes: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  inputCompleteness: "complete" as const,
  missingDataWarnings: [] as string[],
}));

vi.mock("@/config/feature-flags", async (importOriginal) => {
  const a = await importOriginal<typeof import("@/config/feature-flags")>();
  return {
    ...a,
    growthAutonomyFlags: {
      get growthAutonomyV1() {
        return autonomyFlags.v1;
      },
      get growthAutonomyPanelV1() {
        return true;
      },
      get growthAutonomyKillSwitch() {
        return autonomyFlags.kill;
      },
    },
    growthPolicyEnforcementFlags: {
      ...a.growthPolicyEnforcementFlags,
      get growthPolicyEnforcementV1() {
        return autonomyFlags.enf;
      },
    },
  };
});

vi.mock("../growth-policy-enforcement.service", () => ({
  buildGrowthPolicyEnforcementSnapshot: (...args: unknown[]) => buildEnf(...args),
}));

vi.mock("../growth-autonomy-config", () => ({
  parseGrowthAutonomyModeFromEnv: () => modeParsed.mode,
  parseGrowthAutonomyRolloutFromEnv: () => rolloutParsed.stage,
}));

describe("buildGrowthAutonomySnapshot", () => {
  beforeEach(() => {
    autonomyFlags.v1 = true;
    autonomyFlags.kill = false;
    autonomyFlags.enf = true;
    modeParsed.mode = "ASSIST";
    rolloutParsed.stage = "partial";
    buildEnf.mockClear();
    resetGrowthAutonomyMonitoringForTests();
  });

  it("returns kill-switch snapshot without building enforcement", async () => {
    autonomyFlags.kill = true;
    const { buildGrowthAutonomySnapshot } = await import("../growth-autonomy.service");
    const s = await buildGrowthAutonomySnapshot({
      growthDashboardPath: "/en/ca/dashboard/growth",
      surfaceDebug: false,
    });
    expect(s.killSwitchActive).toBe(true);
    expect(s.autonomyLayerEnabled).toBe(false);
    expect(buildEnf).not.toHaveBeenCalled();
  });

  it("OFF mode hides suggestions without debug", async () => {
    modeParsed.mode = "OFF";
    const { buildGrowthAutonomySnapshot } = await import("../growth-autonomy.service");
    const s = await buildGrowthAutonomySnapshot({
      growthDashboardPath: "/en/ca/dashboard/growth",
      surfaceDebug: false,
    });
    expect(s.autonomyMode).toBe("OFF");
    expect(s.counts.hidden).toBeGreaterThan(0);
    expect(s.counts.surfaced).toBe(0);
  });

  it("OFF mode still surfaces blocked rows — never hides policy block", async () => {
    modeParsed.mode = "OFF";
    buildEnf.mockResolvedValueOnce({
      rules: [
        {
          id: "r1",
          target: "strategy_recommendation_promotion",
          mode: "block",
          rationale: "policy",
          source: "policy_snapshot",
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      blockedTargets: ["strategy_recommendation_promotion"],
      frozenTargets: [],
      approvalRequiredTargets: [],
      notes: [],
      createdAt: "2026-01-01T00:00:00.000Z",
      inputCompleteness: "complete",
      missingDataWarnings: [],
    });
    const { buildGrowthAutonomySnapshot } = await import("../growth-autonomy.service");
    const s = await buildGrowthAutonomySnapshot({
      growthDashboardPath: "/en/ca/dashboard/growth",
      surfaceDebug: false,
    });
    const strat = s.suggestions.find((x) => x.id === "cat-strategy-promo");
    expect(strat?.disposition).toBe("blocked");
    expect(s.counts.blocked).toBeGreaterThanOrEqual(1);
  });

  it("SAFE_AUTOPILOT yields prefilled disposition when enforcement allows", async () => {
    modeParsed.mode = "SAFE_AUTOPILOT";
    buildEnf.mockResolvedValueOnce({
      rules: [
        {
          id: "r1",
          target: "strategy_recommendation_promotion",
          mode: "allow",
          rationale: "ok",
          source: "policy_snapshot",
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      blockedTargets: [],
      frozenTargets: [],
      approvalRequiredTargets: [],
      notes: [],
      createdAt: "2026-01-01T00:00:00.000Z",
      inputCompleteness: "complete",
      missingDataWarnings: [],
    });
    const { buildGrowthAutonomySnapshot } = await import("../growth-autonomy.service");
    const s = await buildGrowthAutonomySnapshot({
      growthDashboardPath: "/en/ca/dashboard/growth",
      surfaceDebug: false,
    });
    const strat = s.suggestions.find((x) => x.id === "cat-strategy-promo");
    expect(strat?.disposition).toBe("prefilled_action");
    expect(strat?.prefill?.href).toContain("growthAutonomyFocus=strategy");
  });

  it("respects blocked enforcement target", async () => {
    buildEnf.mockResolvedValueOnce({
      rules: [
        {
          id: "r1",
          target: "strategy_recommendation_promotion",
          mode: "block",
          rationale: "blocked",
          source: "policy_snapshot",
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      blockedTargets: ["strategy_recommendation_promotion"],
      frozenTargets: [],
      approvalRequiredTargets: [],
      notes: [],
      createdAt: "2026-01-01T00:00:00.000Z",
      inputCompleteness: "complete",
      missingDataWarnings: [],
    });
    const { buildGrowthAutonomySnapshot } = await import("../growth-autonomy.service");
    const s = await buildGrowthAutonomySnapshot({
      growthDashboardPath: "/en/ca/dashboard/growth",
      surfaceDebug: false,
    });
    const strat = s.suggestions.find((x) => x.id === "cat-strategy-promo");
    expect(strat?.disposition).toBe("blocked");
  });

  it("marks partial enforcement inputs", async () => {
    buildEnf.mockResolvedValueOnce({
      rules: [],
      blockedTargets: [],
      frozenTargets: [],
      approvalRequiredTargets: [],
      notes: [],
      createdAt: "2026-01-01T00:00:00.000Z",
      inputCompleteness: "partial",
      missingDataWarnings: ["gov"],
    });
    const { buildGrowthAutonomySnapshot } = await import("../growth-autonomy.service");
    const s = await buildGrowthAutonomySnapshot({
      growthDashboardPath: "/en/ca/dashboard/growth",
      surfaceDebug: false,
    });
    expect(s.enforcementInputPartial).toBe(true);
    expect(s.operatorNotes.some((n) => n.startsWith("Partial enforcement inputs"))).toBe(true);
  });

  it("rollout off skips catalog build", async () => {
    rolloutParsed.stage = "off";
    const { buildGrowthAutonomySnapshot } = await import("../growth-autonomy.service");
    const s = await buildGrowthAutonomySnapshot({
      growthDashboardPath: "/en/ca/dashboard/growth",
      surfaceDebug: false,
    });
    expect(s.autonomyLayerEnabled).toBe(false);
    expect(buildEnf).not.toHaveBeenCalled();
  });
});
