import { describe, expect, it } from "vitest";
import { resolveGovernance } from "../governance/governance-resolver";
import type { PolicyDecision, ProposedAction } from "../types/domain.types";

const baseAction = (
  type: ProposedAction["type"],
  risk: ProposedAction["risk"] = "LOW",
): ProposedAction => ({
  id: "pa1",
  type,
  target: { type: "fsbo_listing", id: "l1" },
  confidence: 0.8,
  risk,
  title: "t",
  explanation: "e",
  humanReadableSummary: "h",
  metadata: {},
  suggestedAt: new Date().toISOString(),
  sourceDetectorId: "d",
  opportunityId: "o",
});

const policy = (
  disposition: PolicyDecision["disposition"],
  actionId = "pa1",
): PolicyDecision => ({
  id: "p1",
  actionId,
  disposition,
  violations: [],
  warnings: [],
  evaluatedAt: new Date().toISOString(),
  ruleResults: [],
});

describe("resolveGovernance", () => {
  it("OFF → RECOMMEND_ONLY, no execution", () => {
    const g = resolveGovernance({
      action: baseAction("START_PROMOTION"),
      policy: policy("ALLOW"),
      mode: "OFF",
      dryRunRequested: false,
    });
    expect(g.disposition).toBe("RECOMMEND_ONLY");
    expect(g.allowExecution).toBe(false);
  });

  it("ASSIST + policy ALLOW → RECOMMEND_ONLY (recommendation only)", () => {
    const g = resolveGovernance({
      action: baseAction("CREATE_TASK"),
      policy: policy("ALLOW"),
      mode: "ASSIST",
      dryRunRequested: false,
    });
    expect(g.disposition).toBe("RECOMMEND_ONLY");
    expect(g.allowExecution).toBe(false);
  });

  it("dry-run requested → DRY_RUN", () => {
    const g = resolveGovernance({
      action: baseAction("SCALE_CAMPAIGN_BUDGET"),
      policy: policy("ALLOW"),
      mode: "SAFE_AUTOPILOT",
      dryRunRequested: true,
    });
    expect(g.disposition).toBe("DRY_RUN");
    expect(g.allowExecution).toBe(false);
  });

  it("policy ALLOW_WITH_APPROVAL → REQUIRE_APPROVAL", () => {
    const g = resolveGovernance({
      action: baseAction("CREATE_TASK"),
      policy: policy("ALLOW_WITH_APPROVAL"),
      mode: "FULL_AUTOPILOT_APPROVAL",
      dryRunRequested: false,
    });
    expect(g.disposition).toBe("REQUIRE_APPROVAL");
    expect(g.allowExecution).toBe(false);
  });

  it("SAFE_AUTOPILOT + MEDIUM risk → REQUIRE_APPROVAL (low risk only)", () => {
    const g = resolveGovernance({
      action: baseAction("START_PROMOTION", "MEDIUM"),
      policy: policy("ALLOW"),
      mode: "SAFE_AUTOPILOT",
      dryRunRequested: false,
    });
    expect(g.disposition).toBe("REQUIRE_APPROVAL");
    expect(g.allowExecution).toBe(false);
  });

  it("SAFE_AUTOPILOT + LOW risk + policy ALLOW → AUTO_EXECUTE (allowExecution gated off by default)", () => {
    const g = resolveGovernance({
      action: baseAction("CREATE_TASK", "LOW"),
      policy: policy("ALLOW"),
      mode: "SAFE_AUTOPILOT",
      dryRunRequested: false,
    });
    expect(g.disposition).toBe("AUTO_EXECUTE");
    expect(g.allowExecution).toBe(false);
  });

  it("FULL_AUTOPILOT_APPROVAL + MEDIUM + ALLOW → AUTO_EXECUTE", () => {
    const g = resolveGovernance({
      action: baseAction("CREATE_TASK", "MEDIUM"),
      policy: policy("ALLOW"),
      mode: "FULL_AUTOPILOT_APPROVAL",
      dryRunRequested: false,
    });
    expect(g.disposition).toBe("AUTO_EXECUTE");
    expect(g.allowExecution).toBe(false);
  });

  it("FULL_AUTOPILOT_APPROVAL + HIGH risk → REQUIRE_APPROVAL (broader but not ungated)", () => {
    const g = resolveGovernance({
      action: baseAction("CREATE_TASK", "HIGH"),
      policy: policy("ALLOW"),
      mode: "FULL_AUTOPILOT_APPROVAL",
      dryRunRequested: false,
    });
    expect(g.disposition).toBe("REQUIRE_APPROVAL");
    expect(g.allowExecution).toBe(false);
  });

  it("policy BLOCK → RECOMMEND_ONLY", () => {
    const g = resolveGovernance({
      action: baseAction("START_PROMOTION"),
      policy: policy("BLOCK"),
      mode: "FULL_AUTOPILOT_APPROVAL",
      dryRunRequested: false,
    });
    expect(g.disposition).toBe("RECOMMEND_ONLY");
    expect(g.allowExecution).toBe(false);
  });

  it("legal-only soft warnings → treated as ALLOW for governance progression", () => {
    const g = resolveGovernance({
      action: baseAction("CREATE_TASK", "LOW"),
      policy: {
        id: "p-legal-soft",
        actionId: "pa1",
        disposition: "ALLOW_WITH_APPROVAL",
        violations: [],
        warnings: [{ code: "legal_hub_compliance", message: "advisory", ruleCode: "legal_hub_compliance" }],
        evaluatedAt: new Date().toISOString(),
        ruleResults: [
          {
            ruleCode: "legal_hub_compliance",
            result: "warning",
            metadata: { domain: "legal", severity: "warning" },
          },
        ],
      },
      mode: "SAFE_AUTOPILOT",
      dryRunRequested: false,
    });
    expect(g.disposition).toBe("AUTO_EXECUTE");
  });
});
