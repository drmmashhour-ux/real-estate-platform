import type { SimulationRunContext, SimulationScenarioResult } from "@/modules/e2e-simulation/e2e-simulation.types";
import { apiUrl, fetchEvidence } from "@/modules/e2e-simulation/http-simulation";
import { finalizeScenario, stepProtectedPageAnonymous } from "@/modules/e2e-simulation/scenario-helpers";

export async function runAdminSimulation(ctx: SimulationRunContext): Promise<SimulationScenarioResult> {
  const steps = [];

  steps.push(await stepProtectedPageAnonymous(ctx, "ad-1", "Admin root protected", "/admin"));
  steps.push(await stepProtectedPageAnonymous(ctx, "ad-2", "BNHub admin area protected", "/admin/bnhub"));
  steps.push(await stepProtectedPageAnonymous(ctx, "ad-3", "Compliance queue protected", "/admin/compliance"));
  steps.push(await stepProtectedPageAnonymous(ctx, "ad-4", "Fraud surface protected", "/admin/fraud"));

  const report = await fetchEvidence(apiUrl(ctx, "/api/admin/testing/report"), { method: "GET" });
  steps.push({
    stepId: "ad-5",
    title: "Admin testing report API rejects anonymous",
    status: report.status === 401 || report.status === 403 ? ("PASS" as const) : report.status < 500 ? ("WARNING" as const) : ("FAIL" as const),
    details: `HTTP ${report.status}`,
    routeOrService: "/api/admin/testing/report",
    evidence: report.snippet,
    frictionPoints: [],
    blockers: report.status >= 500 ? ["admin API error"] : [],
  });

  return finalizeScenario({
    scenarioId: "admin-v1",
    scenarioName: "Admin / Moderation Flow",
    domain: "admin",
    steps,
    recommendations: ["Moderation action + audit trail needs authenticated admin session."],
  });
}
