import type { SimulationRunContext, SimulationScenarioResult } from "@/modules/e2e-simulation/e2e-simulation.types";
import { apiUrl, fetchEvidence } from "@/modules/e2e-simulation/http-simulation";
import { finalizeScenario, stepProtectedPageAnonymous, stepPublicPage } from "@/modules/e2e-simulation/scenario-helpers";

export async function runBnhubHostSimulation(ctx: SimulationRunContext): Promise<SimulationScenarioResult> {
  const steps = [];

  steps.push(await stepPublicPage(ctx, "bh-1", "BNHub host dashboard route (public shell)", "/bnhub/host/dashboard"));
  steps.push(await stepProtectedPageAnonymous(ctx, "bh-2", "Host dashboard requires auth", "/dashboard/host"));
  steps.push(await stepProtectedPageAnonymous(ctx, "bh-3", "Host payouts protected", "/dashboard/host/payouts"));

  const suggest = await fetchEvidence(apiUrl(ctx, "/api/bnhub/host/pricing/suggest"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({}),
  });
  steps.push({
    stepId: "bh-4",
    title: "Pricing suggestion API safe failure without auth/body",
    status: suggest.status === 401 || suggest.status === 400 || suggest.status === 403 ? ("PASS" as const) : suggest.status < 500 ? ("WARNING" as const) : ("FAIL" as const),
    details: `HTTP ${suggest.status}`,
    routeOrService: "/api/bnhub/host/pricing/suggest",
    evidence: suggest.snippet,
    frictionPoints: [],
    blockers: suggest.status >= 500 ? ["pricing API server error"] : [],
  });

  return finalizeScenario({
    scenarioId: "bnhub-host-v1",
    scenarioName: "BNHub Host Flow",
    domain: "bnhub_host",
    steps,
    recommendations: ["Listing CRUD + publish requires authenticated host session (not simulated here)."],
  });
}
