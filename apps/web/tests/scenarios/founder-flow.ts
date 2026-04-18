import type { SimulationRunContext, SimulationScenarioResult } from "@/modules/e2e-simulation/e2e-simulation.types";
import { finalizeScenario, stepProtectedPageAnonymous } from "@/modules/e2e-simulation/scenario-helpers";

export async function runFounderSimulation(ctx: SimulationRunContext): Promise<SimulationScenarioResult> {
  const steps = [];

  steps.push(await stepProtectedPageAnonymous(ctx, "fo-1", "CEO / executive surface protected", "/admin/ceo"));
  steps.push(await stepProtectedPageAnonymous(ctx, "fo-2", "Execution dashboard protected", "/admin/execution"));
  steps.push(await stepProtectedPageAnonymous(ctx, "fo-3", "Investor dashboard protected", "/admin/investor-dashboard"));
  steps.push(await stepProtectedPageAnonymous(ctx, "fo-4", "Strategy / LECIPM engines protected", "/admin/lecipm-engines"));

  return finalizeScenario({
    scenarioId: "founder-v1",
    scenarioName: "Founder / Owner Dashboard Flow",
    domain: "founder",
    steps,
    recommendations: ["Weekly briefing / copilot generation requires founder session and may call external AI."],
  });
}
