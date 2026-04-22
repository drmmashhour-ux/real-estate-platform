/**
 * Static cases for admin policy-simulation demo / GET API (score-threshold replay only).
 */
import type { PolicySimulationCase, PolicySimulationConfig } from "./policy-simulation.types";

export const DEMO_POLICY_SIMULATION_CASES: PolicySimulationCase[] = [
  {
    caseId: "demo-low-clean",
    originalPrediction: {
      governanceDisposition: "AUTO_EXECUTE",
      combinedRiskScore: 22,
      legalRiskScore: 20,
      fraudRiskScore: 24,
    },
    truthEvents: [{ type: "clean_run", amount: 0 }],
  },
  {
    caseId: "demo-mid-chargeback",
    originalPrediction: {
      governanceDisposition: "AUTO_EXECUTE",
      combinedRiskScore: 44,
      legalRiskScore: 40,
      fraudRiskScore: 48,
    },
    truthEvents: [{ type: "chargeback", amount: 900 }],
  },
  {
    caseId: "demo-edge-clean",
    originalPrediction: {
      governanceDisposition: "AUTO_EXECUTE",
      combinedRiskScore: 48,
      legalRiskScore: 45,
      fraudRiskScore: 51,
    },
    truthEvents: [{ type: "clean_run", amount: 0 }],
  },
  {
    caseId: "demo-high-chargeback",
    originalPrediction: {
      governanceDisposition: "AUTO_EXECUTE",
      combinedRiskScore: 72,
      legalRiskScore: 70,
      fraudRiskScore: 74,
    },
    truthEvents: [{ type: "chargeback", amount: 2400 }],
  },
];

export const DEMO_BASELINE_CONFIG: PolicySimulationConfig = {
  id: "baseline",
  name: "Baseline gates",
  thresholds: {
    combinedRiskMedium: 28,
    combinedRiskHigh: 52,
    legalWeight: 0.5,
    fraudWeight: 0.5,
  },
};

export const DEMO_SCENARIO_CONFIGS: PolicySimulationConfig[] = [
  {
    id: "strict",
    name: "Stricter",
    thresholds: {
      combinedRiskMedium: 18,
      combinedRiskHigh: 38,
      legalWeight: 0.55,
      fraudWeight: 0.45,
    },
  },
  {
    id: "relaxed",
    name: "Relaxed",
    thresholds: {
      combinedRiskMedium: 38,
      combinedRiskHigh: 68,
      legalWeight: 0.45,
      fraudWeight: 0.55,
    },
  },
];
