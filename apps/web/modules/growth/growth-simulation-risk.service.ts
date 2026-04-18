/**
 * Advisory risk list for simulations — deterministic; not exhaustive.
 */

import type {
  GrowthSimulationBaseline,
  GrowthSimulationRisk,
  GrowthSimulationScenarioInput,
} from "./growth-simulation.types";

export function evaluateGrowthSimulationRisks(
  scenario: GrowthSimulationScenarioInput,
  baseline: GrowthSimulationBaseline,
): GrowthSimulationRisk[] {
  const risks: GrowthSimulationRisk[] = [];

  const push = (severity: GrowthSimulationRisk["severity"], title: string, rationale: string) => {
    risks.push({ severity, title, rationale });
  };

  if (baseline.adsPerformance === "WEAK" && scenario.type === "increase_acquisition") {
    push(
      "high",
      "Scaling acquisition with weak conversion",
      "Additional traffic may dilute efficiency until funnel quality improves.",
    );
  }

  if ((baseline.leadsTotal < 5 || baseline.leadsTodayEarly === 0) && scenario.type === "improve_followup") {
    push("medium", "Low lead throughput", "Follow-up speed matters less when inbound volume is very thin.");
  }

  if (baseline.governanceStatus === "freeze_recommended" || baseline.governanceStatus === "human_review_required") {
    push("high", "Governance review active", "Operational or policy constraints may limit planned changes.");
  }

  if (scenario.type === "mixed_strategy") {
    push("medium", "Execution complexity", "Multiple simultaneous levers increase coordination risk and slower feedback.");
  }

  if (baseline.adsPerformance === "WEAK" && scenario.type === "improve_content") {
    push("medium", "Channel headroom", "Creative improvements may underperform if underlying channel performance is weak.");
  }

  if (risks.length === 0) {
    push("low", "Residual uncertainty", "Estimates omit external market shocks and execution quality variance.");
  }

  return risks.slice(0, 5);
}
