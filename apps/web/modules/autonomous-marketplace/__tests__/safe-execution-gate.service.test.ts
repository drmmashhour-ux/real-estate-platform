import { describe, expect, it } from "vitest";
import { autonomyConfig } from "../config/autonomy.config";
import { evaluateSafeExecutionGate } from "../execution/safe-execution-gate.service";
import type { GovernanceResolution, PolicyDecision } from "../types/domain.types";

const policy = (d: PolicyDecision["disposition"]): PolicyDecision => ({
  id: "p",
  actionId: "a",
  disposition: d,
  violations: [],
  warnings: [],
  evaluatedAt: new Date().toISOString(),
  ruleResults: [],
});

const gov = (d: GovernanceResolution["disposition"], allowExecution: boolean): GovernanceResolution => ({
  disposition: d,
  reason: "",
  allowExecution,
  allowDryRun: true,
});

describe("evaluateSafeExecutionGate", () => {
  it("compliance block always wins", () => {
    const r = evaluateSafeExecutionGate({
      policy: policy("ALLOW"),
      governance: gov("AUTO_EXECUTE", true),
      compliance: { blocked: true, reasonCode: "sanctions" },
      legalRisk: { score: 0 },
      runDryRun: false,
      actionTypeEnabledInConfig: true,
    });
    expect(r.status).toBe("blocked");
    expect(r.reasons).toContain("compliance_block");
    expect(r.allowed).toBe(false);
  });

  it("dryRun forces dry_run", () => {
    const r = evaluateSafeExecutionGate({
      policy: policy("ALLOW"),
      governance: gov("AUTO_EXECUTE", true),
      compliance: { blocked: false },
      legalRisk: { score: 0 },
      runDryRun: true,
      actionTypeEnabledInConfig: true,
    });
    expect(r.status).toBe("dry_run");
    expect(r.allowed).toBe(false);
  });

  it("RECOMMEND_ONLY never executes live", () => {
    const r = evaluateSafeExecutionGate({
      policy: policy("ALLOW"),
      governance: gov("RECOMMEND_ONLY", false),
      compliance: { blocked: false },
      legalRisk: { score: 0 },
      runDryRun: false,
      actionTypeEnabledInConfig: true,
    });
    expect(r.allowed).toBe(false);
    expect(r.reasons).toContain("governance_recommend_only");
  });

  it("AUTO_EXECUTE requires governance allowExecution and policy ALLOW", () => {
    const r = evaluateSafeExecutionGate({
      policy: policy("ALLOW"),
      governance: gov("AUTO_EXECUTE", autonomyConfig.governanceAutoExecuteEnabled),
      compliance: { blocked: false },
      legalRisk: { score: 0 },
      runDryRun: false,
      actionTypeEnabledInConfig: true,
    });
    expect(r.allowed).toBe(autonomyConfig.governanceAutoExecuteEnabled);
  });
});
