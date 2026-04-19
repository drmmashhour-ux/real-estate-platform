import { describe, it, expect } from "vitest";
import type { GrowthPolicyEnforcementSnapshot } from "../growth-policy-enforcement.types";
import type { GrowthPolicyEnforcementDisabledResponse } from "../growth-policy-enforcement-api.types";
import { isGrowthPolicyEnforcementEnabledResponse } from "../growth-policy-enforcement-api.types";
import { policyEnforcementSnapshotLooksPartial } from "../growth-policy-enforcement-rollout.helpers";
import { simulationEnforcementSnapshotDebugLabel } from "../growth-simulation-enforcement-ui";

describe("Growth policy enforcement — rollout behaviors (deterministic)", () => {
  it("when enforcement is off via API shape: snapshot is null and enabled guard is false", () => {
    const disabled: GrowthPolicyEnforcementDisabledResponse = {
      enforcementLayerEnabled: false,
      enforcementPanelFlagEnabled: true,
      advisoryScopeOnly: true,
      snapshot: null,
      operatorMessage: "layer off",
    };
    expect(disabled.snapshot).toBeNull();
    expect(isGrowthPolicyEnforcementEnabledResponse(disabled)).toBe(false);
  });

  it("when enforcement is on with partial upstream inputs: snapshot flags incomplete / weak certainty", () => {
    const snap: GrowthPolicyEnforcementSnapshot = {
      rules: [],
      blockedTargets: [],
      frozenTargets: [],
      approvalRequiredTargets: [],
      notes: [],
      createdAt: "2026-01-01T00:00:00.000Z",
      inputCompleteness: "partial",
      missingDataWarnings: ["policy_unavailable"],
    };
    expect(policyEnforcementSnapshotLooksPartial(snap)).toBe(true);
  });

  it("dashboard-style simulation wiring: layer off yields layer_off label (clear UI branch)", () => {
    expect(
      simulationEnforcementSnapshotDebugLabel({
        enforcementLayerEnabled: false,
        enforcementSnapshotReady: true,
        enforcementSnapshot: null,
      }),
    ).toBe("layer_off");
  });

  it("simulation panel: enforcement on + snapshot ready + null snapshot stays absent until hydration", () => {
    expect(
      simulationEnforcementSnapshotDebugLabel({
        enforcementLayerEnabled: true,
        enforcementSnapshotReady: true,
        enforcementSnapshot: null,
      }),
    ).toBe("absent");
  });

  it("simulation panel: enforcement on + snapshot present yields received", () => {
    const snap: GrowthPolicyEnforcementSnapshot = {
      rules: [],
      blockedTargets: [],
      frozenTargets: [],
      approvalRequiredTargets: [],
      notes: ["Partial inputs: x"],
      createdAt: "2026-01-01T00:00:00.000Z",
      inputCompleteness: "partial",
      missingDataWarnings: [],
    };
    expect(
      simulationEnforcementSnapshotDebugLabel({
        enforcementLayerEnabled: true,
        enforcementSnapshotReady: true,
        enforcementSnapshot: snap,
      }),
    ).toBe("received");
  });
});
