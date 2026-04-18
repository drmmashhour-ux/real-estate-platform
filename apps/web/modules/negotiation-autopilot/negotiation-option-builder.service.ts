import type { NegotiationScenario } from "./negotiation-autopilot.types";

/** Groups scenarios for UI — no ranking manipulation. */
export function bundleScenariosByRisk(scenarios: NegotiationScenario[]) {
  return {
    high: scenarios.filter((s) => s.riskLevel === "high"),
    medium: scenarios.filter((s) => s.riskLevel === "medium"),
    low: scenarios.filter((s) => s.riskLevel === "low"),
  };
}
