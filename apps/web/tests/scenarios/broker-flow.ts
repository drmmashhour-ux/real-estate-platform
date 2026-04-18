import type { SimulationRunContext, SimulationScenarioResult } from "@/modules/e2e-simulation/e2e-simulation.types";
import { apiUrl, fetchEvidence } from "@/modules/e2e-simulation/http-simulation";
import { finalizeScenario, stepProtectedPageAnonymous } from "@/modules/e2e-simulation/scenario-helpers";

export async function runBrokerSimulation(ctx: SimulationRunContext): Promise<SimulationScenarioResult> {
  const steps = [];

  steps.push(await stepProtectedPageAnonymous(ctx, "br-1", "Broker dashboard requires auth", "/dashboard/broker"));
  steps.push(
    await stepProtectedPageAnonymous(ctx, "br-2", "Broker CRM protected", "/dashboard/broker/crm")
  );
  steps.push(
    await stepProtectedPageAnonymous(ctx, "br-3", "Broker pipeline protected", "/dashboard/broker/pipeline")
  );

  const roiBroker = await fetchEvidence(apiUrl(ctx, "/api/roi/broker"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sample: "simulation" }),
  });
  steps.push({
    stepId: "br-4",
    title: "Broker ROI API responds without 5xx (may be 400/403 if feature off)",
    status: roiBroker.status < 500 ? ("PASS" as const) : ("FAIL" as const),
    details: `HTTP ${roiBroker.status}`,
    routeOrService: "/api/roi/broker",
    evidence: roiBroker.snippet,
    frictionPoints: roiBroker.status === 403 ? ["feature flag off"] : [],
    blockers: roiBroker.status >= 500 ? ["server error"] : [],
  });

  return finalizeScenario({
    scenarioId: "broker-v1",
    scenarioName: "Residential Broker Flow",
    domain: "broker",
    steps,
    recommendations: [
      "Deal creation, forms, and timeline updates require authenticated broker — use Playwright with test user or manual QA.",
    ],
  });
}
