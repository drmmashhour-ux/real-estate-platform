import { describe, expect, it } from "vitest";
import {
  buildPolicySimulationInput,
  comparePolicySimulationScenarios,
  isRestrictiveDisposition,
  runPolicySimulationScenario,
} from "../simulation/policy-simulation.service";
import type { PolicySimulationCase } from "../simulation/policy-simulation.types";

describe("policy-simulation.service", () => {
  it("classifies restrictive dispersions deterministically", () => {
    expect(isRestrictiveDisposition("ALLOW_PREVIEW", "preview")).toBe(false);
    expect(isRestrictiveDisposition("CAUTION_PREVIEW", "preview")).toBe(true);
    expect(isRestrictiveDisposition("AUTO_EXECUTE", "execution")).toBe(false);
    expect(isRestrictiveDisposition("REQUIRE_APPROVAL", "execution")).toBe(true);
  });

  it("sandbox input sets simulation metadata without mutating caller object", () => {
    const base = {
      mode: "execution" as const,
      regionCode: "US",
      signals: [],
      metadata: { dryRun: true },
    };
    const merged = buildPolicySimulationInput(base, {
      id: "t1",
      name: "Test",
      thresholds: { combinedRiskMedium: 30 },
    });
    expect(merged.metadata?.policySimulationSandbox).toBe(true);
    expect(merged.policySimulation?.thresholds?.combinedRiskMedium).toBe(30);
    expect(base.metadata?.policySimulationSandbox).toBeUndefined();
  });

  it("computes FP when restrictive but truth is clean", async () => {
    const cases: PolicySimulationCase[] = [
      {
        caseId: "c1",
        replayInput: {
          mode: "execution",
          regionCode: "US",
          fraudFlag: true,
          signals: [{ type: "chargeback_spike", severity: "critical" }],
          revenueFacts: {
            grossBookingValue30d: 100000,
            chargebacks30d: 8000,
            refunds30d: 5000,
          },
          metadata: {},
        },
        originalPrediction: {
          governanceDisposition: "RECOMMEND_ONLY",
          combinedRiskScore: 40,
          legalRiskScore: 20,
          fraudRiskScore: 50,
        },
        truthEvents: [{ type: "clean_run", amount: 0 }],
      },
    ];

    const cfg = { id: "strict", name: "Strict", overrides: { forceRequireApproval: true } };
    const r = await runPolicySimulationScenario(cases, cfg);
    expect(r.totalCases).toBe(1);
    expect(r.falsePositiveRate).toBe(1);
    expect(r.falseNegativeRate).toBe(0);
  });

  it("comparePolicySimulationScenarios returns baseline and deltas", async () => {
    const cases: PolicySimulationCase[] = [
      {
        caseId: "loss-1",
        replayInput: {
          mode: "execution",
          regionCode: "US",
          signals: [{ type: "synthetic_action_risk_high", severity: "warning" }],
          revenueFacts: { grossBookingValue30d: 50000, refunds30d: 2000 },
          metadata: {},
        },
        originalPrediction: {
          governanceDisposition: "RECOMMEND_ONLY",
          combinedRiskScore: 20,
          legalRiskScore: 10,
          fraudRiskScore: 15,
        },
        truthEvents: [{ type: "chargeback", amount: 1200 }],
      },
    ];

    const report = await comparePolicySimulationScenarios(
      cases,
      { id: "baseline", name: "Baseline" },
      [{ id: "alt", name: "Tighter medium", thresholds: { combinedRiskMedium: 15, combinedRiskHigh: 40 } }],
    );

    expect(report.baseline.configId).toBe("baseline");
    expect(report.scenarios.length).toBe(1);
    expect(report.scenarios[0].delta.falsePositiveRate).toBeDefined();
  });
});
