import { describe, expect, it } from "vitest";
import {
  canPromoteTarget,
  getEnforcementForTarget,
  isTargetBlocked,
  isTargetFrozen,
} from "../growth-policy-enforcement-query.service";
import { assembleGrowthPolicyEnforcementSnapshot } from "../growth-policy-enforcement.service";
import type { AssembleGrowthPolicyEnforcementInput } from "../growth-policy-enforcement.service";

function minimalSnapshot() {
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
    autopilotExecutionEnabled: false,
    missingDataWarnings: [],
  };
  return assembleGrowthPolicyEnforcementSnapshot(input);
}

describe("growth-policy-enforcement-query.service", () => {
  it("getEnforcementForTarget returns a decision for each known target", () => {
    const snap = minimalSnapshot();
    const d = getEnforcementForTarget("panel_render_hint", snap);
    expect(d.target).toBe("panel_render_hint");
    expect(["allow", "advisory_only", "approval_required", "freeze", "block"]).toContain(d.mode);
  });

  it("isTargetFrozen reflects snapshot lists", () => {
    const snap = minimalSnapshot();
    expect(isTargetFrozen("learning_adjustments", snap)).toBe(true);
    expect(isTargetBlocked("learning_adjustments", snap)).toBe(false);
  });

  it("canPromoteTarget is false when mode not allow", () => {
    const snap = minimalSnapshot();
    expect(canPromoteTarget("learning_adjustments", snap)).toBe(false);
  });
});
