import { describe, expect, it } from "vitest";
import { buildGrowthPolicyEnforcementNotes } from "../growth-policy-enforcement-explainer.service";
import { assembleGrowthPolicyEnforcementSnapshot } from "../growth-policy-enforcement.service";
import type { AssembleGrowthPolicyEnforcementInput } from "../growth-policy-enforcement.service";

describe("buildGrowthPolicyEnforcementNotes", () => {
  it("includes learning freeze line when frozen", () => {
    const input: AssembleGrowthPolicyEnforcementInput = {
      policySnapshot: null,
      governance: null,
      learningControl: {
        state: "freeze_recommended",
        confidence: 1,
        reasons: [],
        recommendedActions: [],
        observedSignals: {},
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      autopilotExecutionEnabled: true,
      missingDataWarnings: [],
    };
    const snap = assembleGrowthPolicyEnforcementSnapshot(input);
    const notes = buildGrowthPolicyEnforcementNotes(snap);
    expect(notes.some((n) => n.includes("Learning"))).toBe(true);
  });
});
