import { describe, expect, it } from "vitest";

import { comparePolicyScenarios } from "../simulation/policy-simulation-comparator.service";
import { runPolicySimulation } from "../simulation/policy-simulation.engine";
import type { PolicySimulationCase } from "../simulation/policy-simulation.types";

describe("policy-simulation.engine", () => {
  it("stricter combined gates reduce false negatives vs permissive baseline on harmful truth", () => {
    const cases: PolicySimulationCase[] = [
      {
        originalPrediction: {
          governanceDisposition: "AUTO_EXECUTE",
          combinedRiskScore: 35,
          legalRiskScore: 35,
          fraudRiskScore: 35,
        },
        truthEvents: [{ type: "chargeback", amount: 800 }],
      },
    ];

    const permissive = runPolicySimulation(cases, {
      id: "loose",
      name: "Loose",
      thresholds: { combinedRiskMedium: 90, combinedRiskHigh: 95 },
    });

    const strict = runPolicySimulation(cases, {
      id: "strict",
      name: "Strict",
      thresholds: { combinedRiskMedium: 20, combinedRiskHigh: 34 },
    });

    expect(permissive.falseNegativeRate).toBeGreaterThan(0);
    expect(strict.falseNegativeRate).toBe(0);
    expect(strict.leakedRevenue).toBeLessThan(permissive.leakedRevenue);
  });

  it("relaxed gates reduce false positives vs tighter baseline on clean truth", () => {
    const cases: PolicySimulationCase[] = [
      {
        originalPrediction: {
          governanceDisposition: "AUTO_EXECUTE",
          combinedRiskScore: 52,
          legalRiskScore: 52,
          fraudRiskScore: 52,
        },
        truthEvents: [{ type: "clean_run", amount: 0 }],
      },
    ];

    const tight = runPolicySimulation(cases, {
      id: "tight",
      name: "Tight",
      thresholds: { combinedRiskMedium: 45, combinedRiskHigh: 50 },
    });

    const relaxed = runPolicySimulation(cases, {
      id: "relax",
      name: "Relax",
      thresholds: { combinedRiskMedium: 55, combinedRiskHigh: 95 },
    });

    expect(tight.falsePositiveRate).toBeGreaterThan(0);
    expect(relaxed.falsePositiveRate).toBe(0);
  });

  it("sums leaked revenue from harmful chargeback under ALLOW path", () => {
    const cases: PolicySimulationCase[] = [
      {
        originalPrediction: {
          governanceDisposition: "AUTO_EXECUTE",
          combinedRiskScore: 15,
          legalRiskScore: 14,
          fraudRiskScore: 16,
        },
        truthEvents: [{ type: "chargeback", amount: 640 }],
      },
      {
        originalPrediction: {
          governanceDisposition: "AUTO_EXECUTE",
          combinedRiskScore: 12,
          legalRiskScore: 12,
          fraudRiskScore: 12,
        },
        truthEvents: [{ type: "chargeback", amount: 100 }],
      },
    ];

    const r = runPolicySimulation(cases, {
      id: "allow",
      name: "Very loose",
      thresholds: { combinedRiskMedium: 99, combinedRiskHigh: 99 },
    });

    expect(r.leakedRevenue).toBe(740);
    expect(r.falseNegativeRate).toBe(1);
  });

  it("computes deltas vs baseline for scenario configs", () => {
    const cases: PolicySimulationCase[] = [
      {
        originalPrediction: {
          governanceDisposition: "AUTO_EXECUTE",
          combinedRiskScore: 38,
          legalRiskScore: 38,
          fraudRiskScore: 38,
        },
        truthEvents: [{ type: "clean_run", amount: 0 }],
      },
    ];

    const baseline = runPolicySimulation(cases, {
      id: "b",
      name: "Baseline",
      thresholds: { combinedRiskMedium: 34, combinedRiskHigh: 80 },
    });

    const scenario = runPolicySimulation(
      cases,
      {
        id: "strict",
        name: "Strict",
        thresholds: { combinedRiskMedium: 10, combinedRiskHigh: 37 },
      },
      baseline,
    );

    expect(scenario.delta.falsePositiveRate).toBeGreaterThan(0);
    expect(scenario.falsePositiveRate).toBeGreaterThan(baseline.falsePositiveRate);
  });

  it("comparePolicyScenarios returns baseline, scenarios, bestScenarioId", () => {
    const cases: PolicySimulationCase[] = [
      {
        originalPrediction: {
          governanceDisposition: "AUTO_EXECUTE",
          combinedRiskScore: 42,
          legalRiskScore: 42,
          fraudRiskScore: 42,
        },
        truthEvents: [{ type: "chargeback", amount: 400 }],
      },
      {
        originalPrediction: {
          governanceDisposition: "AUTO_EXECUTE",
          combinedRiskScore: 25,
          legalRiskScore: 24,
          fraudRiskScore: 26,
        },
        truthEvents: [{ type: "clean_run", amount: 0 }],
      },
    ];

    const report = comparePolicyScenarios(
      cases,
      { id: "base", name: "Baseline", thresholds: { combinedRiskMedium: 30, combinedRiskHigh: 55 } },
      [
        { id: "s1", name: "Stricter", thresholds: { combinedRiskMedium: 20, combinedRiskHigh: 45 } },
        { id: "s2", name: "Relaxed", thresholds: { combinedRiskMedium: 40, combinedRiskHigh: 70 } },
      ],
    );

    expect(report.baseline.configId).toBe("base");
    expect(report.scenarios).toHaveLength(2);
    expect(report.scenarios.every((s) => s.delta.falseNegativeRate !== undefined)).toBe(true);
    expect(report.bestScenarioId).toBeDefined();
  });
});
