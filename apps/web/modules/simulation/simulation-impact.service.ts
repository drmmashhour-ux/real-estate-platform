import type {
  PredictedMetrics,
  RecommendedAction,
  ScenarioInput,
  SimulationBaseline,
  SimulationConfidence,
} from "./simulation.types";

export function confidenceFromScenario(s: ScenarioInput): SimulationConfidence {
  const ext =
    Math.abs(s.leadVolumeMultiplier - 1) > 0.45
    || Math.abs(s.pricingAdjustment) > 0.12
    || Math.abs(s.trustThresholdChange) > 7
    || s.autopilotLevel >= 3;
  if (ext) return "low";
  if (Math.abs(s.marketingBoost) > 0.4 || s.autopilotLevel === 2) return "medium";
  return "high";
}

export function assessRiskWarnings(
  scenario: ScenarioInput,
  predicted: PredictedMetrics,
  baseline: SimulationBaseline,
): string[] {
  const w: string[] = [];
  if (predicted.disputeRiskChangePts >= 4) {
    w.push("Simulated dispute risk increases — consider staged pricing and clearer buyer comms before going live.");
  }
  if (predicted.trustChangePts <= -2 && (baseline.trustScore ?? 100) < 70) {
    w.push("Trust was already under pressure in baseline; further erosion may throttle marketplace distribution in production.");
  }
  if (scenario.autopilotLevel >= 2 && predicted.workloadChangePct < -5) {
    w.push("Higher autopilot in simulation cuts modeled workload but raises governance and exception-handling needs.");
  }
  if (scenario.leadVolumeMultiplier > 1.4 && (baseline.openDisputes ?? 0) > 0) {
    w.push("Open disputes exist; scaling lead volume before remediation may amplify SLA risk (simulation only).");
  }
  if (w.length === 0) w.push("No critical simulated risk flags — still validate with a pilot cohort before global rollout.");
  return w;
}

export function buildRecommendedActions(
  scenario: ScenarioInput,
  predicted: PredictedMetrics,
  riskWarnings: string[],
): RecommendedAction[] {
  const actions: RecommendedAction[] = [
    {
      id: "ai-ceo",
      label: "Propose in AI CEO queue",
      rationale:
        "Package this scenario for governed review — numbers stay simulated until a reviewer approves a system adjustment.",
      href: "/dashboard/admin/ai-ceo/system-adjustments",
    },
    {
      id: "war-room",
      label: "Open territory war room",
      rationale: "Compare regional fit before changing acquisition or trust gates.",
      href: "/dashboard/admin/territory-war-room",
    },
  ];
  if (predicted.conversionChangePts > 1) {
    actions.push({
      id: "leads",
      label: "Tune leads SLA",
      rationale: "Simulated gain ties to response speed — align CRM SLAs and assistant defaults.",
      href: "/dashboard/lecipm/leads",
    });
  }
  if (riskWarnings.length > 1 || predicted.disputeRiskChangePts > 2) {
    actions.push({
      id: "disputes",
      label: "Review dispute playbooks",
      rationale: "Mitigate the modeled dispute uptick with fulfillment checkpoints.",
      href: "/dashboard/admin/disputes",
    });
  }
  if (scenario.pricingAdjustment > 0.05) {
    actions.push({
      id: "trust",
      label: "Check trust console",
      rationale: "Price moves may affect trust perception — align messaging and review thresholds.",
      href: "/dashboard/admin/trust-score",
    });
  }
  return actions.slice(0, 5);
}
