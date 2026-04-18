import { describe, expect, it } from "vitest";
import {
  applyPolicyToAutopilotUi,
  applyPolicyToContentAssist,
  applyPolicyToFusionBridges,
  applyPolicyToLearning,
  applyPolicyToMessagingAssist,
  applyPolicyToMissionControlPromotion,
} from "../growth-policy-enforcement-bridge.service";
import { assembleGrowthPolicyEnforcementSnapshot } from "../growth-policy-enforcement.service";
import type { AssembleGrowthPolicyEnforcementInput } from "../growth-policy-enforcement.service";

describe("growth-policy-enforcement-bridge.service", () => {
  it("null snapshot is permissive defaults", () => {
    expect(applyPolicyToAutopilotUi(null).hideAdvisoryConversionAffordances).toBe(false);
    expect(applyPolicyToLearning(null).allowWeightAdjustments).toBe(true);
    expect(applyPolicyToFusionBridges(null).suppressBridgePromotion).toBe(false);
    expect(applyPolicyToContentAssist(null).suppressRegenerateTriggers).toBe(false);
    expect(applyPolicyToMissionControlPromotion(null).suppressPromotion).toBe(false);
    expect(applyPolicyToMessagingAssist(null).blockOutboundPromotion).toBe(false);
  });

  it("learning freeze blocks weight application", () => {
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
    expect(applyPolicyToLearning(snap).allowWeightAdjustments).toBe(false);
  });

  it("bridge gate does not mutate snapshot", () => {
    const input: AssembleGrowthPolicyEnforcementInput = {
      policySnapshot: null,
      governance: null,
      learningControl: null,
      autopilotExecutionEnabled: true,
      missingDataWarnings: [],
    };
    const snap = assembleGrowthPolicyEnforcementSnapshot(input);
    const before = JSON.stringify(snap);
    applyPolicyToFusionBridges(snap);
    expect(JSON.stringify(snap)).toBe(before);
  });
});
