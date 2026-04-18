import type { SimulationRunContext, SimulationScenarioResult } from "@/modules/e2e-simulation/e2e-simulation.types";
import { apiUrl, fetchEvidence, fullUrl } from "@/modules/e2e-simulation/http-simulation";
import { finalizeScenario, stepProtectedPageAnonymous, stepPublicPage } from "@/modules/e2e-simulation/scenario-helpers";

export async function runBnhubGuestSimulation(ctx: SimulationRunContext): Promise<SimulationScenarioResult> {
  const steps = [];

  steps.push(await stepPublicPage(ctx, "bg-1", "Homepage loads", "/"));
  steps.push(await stepPublicPage(ctx, "bg-2", "BNHub stays page loads", "/bnhub/stays"));
  steps.push(await stepPublicPage(ctx, "bg-3", "BNHub hub entry loads", "/bnhub"));

  const browseUrl = apiUrl(ctx, "/api/buyer/browse");
  const browse = await fetchEvidence(`${browseUrl}?limit=3`, { method: "GET" });
  steps.push({
    stepId: "bg-4",
    title: "Buyer browse API responds",
    status: browse.status < 500 ? ("PASS" as const) : ("FAIL" as const),
    details: `HTTP ${browse.status}`,
    routeOrService: browseUrl,
    evidence: browse.snippet,
    frictionPoints: browse.status === 429 ? ["rate limit"] : [],
    blockers: browse.status >= 500 ? [`HTTP ${browse.status}`] : [],
  });

  const listingProbe = apiUrl(ctx, "/api/ready");
  const ready = await fetchEvidence(listingProbe, { method: "GET" });
  steps.push({
    stepId: "bg-5",
    title: "API ready probe",
    status: ready.ok ? ("PASS" as const) : ("FAIL" as const),
    details: `HTTP ${ready.status}`,
    routeOrService: listingProbe,
    evidence: ready.snippet,
    frictionPoints: [],
    blockers: ready.status >= 500 ? ["API unhealthy"] : [],
  });

  steps.push(
    await stepProtectedPageAnonymous(ctx, "bg-6", "Booking checkout requires session (Stripe path)", "/dashboard/buyer")
  );

  const stripeSmoke = await fetchEvidence(apiUrl(ctx, "/api/stripe/checkout"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  });
  steps.push({
    stepId: "bg-7",
    title: "Stripe checkout rejects empty unauthenticated body safely",
    status: stripeSmoke.status < 500 ? ("PASS" as const) : ("FAIL" as const),
    details: `HTTP ${stripeSmoke.status}`,
    routeOrService: "/api/stripe/checkout",
    evidence: stripeSmoke.snippet,
    frictionPoints: [],
    blockers: stripeSmoke.status >= 500 ? ["checkout route error"] : [],
  });

  return finalizeScenario({
    scenarioId: "bnhub-guest-v1",
    scenarioName: "BNHub Guest Flow",
    domain: "bnhub_guest",
    steps,
    recommendations: [
      "Full booking + price breakdown UI requires Playwright or manual QA with a signed-in guest.",
    ],
  });
}
