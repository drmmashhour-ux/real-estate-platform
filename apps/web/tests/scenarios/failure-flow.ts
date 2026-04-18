import type { SimulationRunContext, SimulationScenarioResult } from "@/modules/e2e-simulation/e2e-simulation.types";
import { apiUrl, fetchEvidence } from "@/modules/e2e-simulation/http-simulation";
import { finalizeScenario } from "@/modules/e2e-simulation/scenario-helpers";

export async function runFailureEdgeSimulation(ctx: SimulationRunContext): Promise<SimulationScenarioResult> {
  const steps = [];

  const whBad = await fetchEvidence(apiUrl(ctx, "/api/stripe/webhook"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "not-json",
  });
  steps.push({
    stepId: "fe-1",
    title: "Stripe webhook rejects invalid body safely",
    status: whBad.status === 400 || whBad.status === 415 ? ("PASS" as const) : whBad.status < 500 ? ("WARNING" as const) : ("FAIL" as const),
    details: `HTTP ${whBad.status}`,
    routeOrService: "/api/stripe/webhook",
    evidence: whBad.snippet,
    frictionPoints: [],
    blockers: whBad.status >= 500 ? ["webhook 5xx on bad body"] : [],
  });

  const adminLeak = await fetchEvidence(apiUrl(ctx, "/api/admin/compliance/cases"), { method: "GET" });
  steps.push({
    stepId: "fe-2",
    title: "Admin compliance API rejects anonymous",
    status: adminLeak.status === 401 || adminLeak.status === 403 ? ("PASS" as const) : adminLeak.status < 500 ? ("WARNING" as const) : ("FAIL" as const),
    details: `HTTP ${adminLeak.status}`,
    routeOrService: "/api/admin/compliance/cases",
    evidence: adminLeak.snippet.slice(0, 120),
    frictionPoints: [],
    blockers: adminLeak.status >= 500 ? ["admin 5xx"] : [],
  });

  const rate = await fetchEvidence(apiUrl(ctx, "/api/stripe/checkout"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      paymentType: "booking",
      bookingId: "not-a-uuid",
      successUrl: "https://a.com",
      cancelUrl: "https://a.com",
      amountCents: 0,
    }),
  });
  steps.push({
    stepId: "fe-3",
    title: "Invalid booking checkout rejected (not 5xx)",
    status: rate.status < 500 ? ("PASS" as const) : ("FAIL" as const),
    details: `HTTP ${rate.status}`,
    routeOrService: "/api/stripe/checkout",
    evidence: rate.snippet.slice(0, 160),
    frictionPoints: [],
    blockers: rate.status >= 500 ? ["checkout 5xx on bad input"] : [],
  });

  const analytics = await fetchEvidence(apiUrl(ctx, "/api/analytics/track"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ bad: true }),
  });
  steps.push({
    stepId: "fe-4",
    title: "Analytics track handles malformed payload without 5xx",
    status: analytics.status < 500 ? ("PASS" as const) : ("FAIL" as const),
    details: `HTTP ${analytics.status}`,
    routeOrService: "/api/analytics/track",
    evidence: analytics.snippet.slice(0, 120),
    frictionPoints: [],
    blockers: analytics.status >= 500 ? ["analytics 5xx"] : [],
  });

  return finalizeScenario({
    scenarioId: "failure-v1",
    scenarioName: "Failure / Edge Cases",
    domain: "failure_edge",
    steps,
    recommendations: [
      "Cross-tenant broker/deal tests require two authenticated broker sessions — add Playwright with seeded users.",
    ],
  });
}
