import { describe, it, expect } from "vitest";
import {
  isGrowthPolicyEnforcementEnabledResponse,
  type GrowthPolicyEnforcementGetResponse,
} from "../growth-policy-enforcement-api.types";

describe("growth-policy-enforcement-api.types", () => {
  it("narrows enabled responses", () => {
    const disabled: GrowthPolicyEnforcementGetResponse = {
      enforcementLayerEnabled: false,
      enforcementPanelFlagEnabled: true,
      advisoryScopeOnly: true,
      snapshot: null,
      operatorMessage: "off",
    };
    expect(isGrowthPolicyEnforcementEnabledResponse(disabled)).toBe(false);

    const enabled: GrowthPolicyEnforcementGetResponse = {
      enforcementLayerEnabled: true,
      enforcementPanelFlagEnabled: true,
      advisoryScopeOnly: true,
      snapshot: {
        rules: [],
        blockedTargets: [],
        frozenTargets: [],
        approvalRequiredTargets: [],
        notes: [],
        createdAt: "2026-01-01T00:00:00.000Z",
        inputCompleteness: "complete",
        missingDataWarnings: [],
      },
    };
    expect(isGrowthPolicyEnforcementEnabledResponse(enabled)).toBe(true);
  });
});
