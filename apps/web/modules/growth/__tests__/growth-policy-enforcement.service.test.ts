import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  assembleGrowthPolicyEnforcementSnapshot,
  type AssembleGrowthPolicyEnforcementInput,
} from "../growth-policy-enforcement.service";

describe("assembleGrowthPolicyEnforcementSnapshot", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("builds safely from minimal / partial inputs (defaults)", () => {
    const input: AssembleGrowthPolicyEnforcementInput = {
      policySnapshot: null,
      governance: null,
      learningControl: null,
      autopilotExecutionEnabled: false,
      missingDataWarnings: ["policy_unavailable"],
    };
    const s = assembleGrowthPolicyEnforcementSnapshot(input);
    expect(s.rules.length).toBeGreaterThan(0);
    expect(s.notes.some((n) => n.includes("Partial inputs"))).toBe(true);
    expect(s.notes.some((n) => n.includes("non-critical"))).toBe(true);
    expect(s.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("freezes learning_adjustments when learning control recommends freeze", () => {
    const input: AssembleGrowthPolicyEnforcementInput = {
      policySnapshot: null,
      governance: null,
      learningControl: {
        state: "freeze_recommended",
        confidence: 0.9,
        reasons: [],
        recommendedActions: [],
        observedSignals: {},
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      autopilotExecutionEnabled: true,
      missingDataWarnings: [],
    };
    const s = assembleGrowthPolicyEnforcementSnapshot(input);
    const r = s.rules.find((x) => x.target === "learning_adjustments");
    expect(r?.mode).toBe("freeze");
    expect(s.frozenTargets).toContain("learning_adjustments");
  });
});
