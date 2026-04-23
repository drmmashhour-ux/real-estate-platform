import { describe, expect, it } from "vitest";

import { getDomainMatrixRow } from "../autopilot-domain-matrix.service";
import { AUTOPILOT_POLICY_RULE_IDS } from "../full-autopilot-policy-rule-ids";
import { evaluateAutopilotPolicy } from "../full-autopilot-policy.service";

describe("full autopilot policy", () => {
  const leadMatrix = getDomainMatrixRow("lead_routing")!;
  const pricingMatrix = getDomainMatrixRow("pricing")!;

  it("allows bounded low-risk auto under SAFE_AUTOPILOT", () => {
    const d = evaluateAutopilotPolicy({
      domain: "lead_routing",
      actionType: "lead.route",
      matrix: leadMatrix,
      effectiveMode: "SAFE_AUTOPILOT",
      killSwitch: "ON",
      globalPaused: false,
    });
    expect(d.outcome).toBe("ALLOW_AUTOMATIC");
  });

  it("blocks when kill switch is OFF", () => {
    const d = evaluateAutopilotPolicy({
      domain: "lead_routing",
      actionType: "lead.route",
      matrix: leadMatrix,
      effectiveMode: "SAFE_AUTOPILOT",
      killSwitch: "OFF",
      globalPaused: false,
    });
    expect(d.outcome).toBe("BLOCK");
  });

  it("never auto-executes pricing changes in v1", () => {
    const d = evaluateAutopilotPolicy({
      domain: "pricing",
      actionType: "pricing.adjust_listing",
      matrix: pricingMatrix,
      effectiveMode: "SAFE_AUTOPILOT",
      killSwitch: "ON",
      globalPaused: false,
    });
    expect(d.outcome).not.toBe("ALLOW_AUTOMATIC");
  });

  it("requires approval in ASSIST mode", () => {
    const d = evaluateAutopilotPolicy({
      domain: "lead_routing",
      actionType: "lead.route",
      matrix: leadMatrix,
      effectiveMode: "ASSIST",
      killSwitch: "ON",
      globalPaused: false,
    });
    expect(d.outcome).toBe("REQUIRE_APPROVAL");
  });

  it("forces approval when caller marks compliance-sensitive context", () => {
    const d = evaluateAutopilotPolicy({
      domain: "lead_routing",
      actionType: "lead.route",
      matrix: leadMatrix,
      effectiveMode: "SAFE_AUTOPILOT",
      killSwitch: "ON",
      globalPaused: false,
      context: { complianceSensitive: true },
    });
    expect(d.outcome).toBe("REQUIRE_APPROVAL");
    expect(d.policyRuleId).toBe(AUTOPILOT_POLICY_RULE_IDS.CONTEXT_FORCES_APPROVAL);
  });
});
