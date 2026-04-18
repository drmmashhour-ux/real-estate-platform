import type { SimulationRunContext, SimulationScenarioResult } from "@/modules/e2e-simulation/e2e-simulation.types";
import { apiUrl, fetchEvidence } from "@/modules/e2e-simulation/http-simulation";
import { finalizeScenario } from "@/modules/e2e-simulation/scenario-helpers";

export async function runAiSystemsSimulation(ctx: SimulationRunContext): Promise<SimulationScenarioResult> {
  const steps = [];

  const roiBody = {
    currentPlatformFeePercent: 0.12,
    lecipmPlanKey: "pro" as const,
    city: "Montreal",
    scenarioPreset: "standard" as const,
  };
  const roi = await fetchEvidence(apiUrl(ctx, "/api/roi/calculate"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(roiBody),
  });
  steps.push({
    stepId: "ai-1",
    title: "ROI calculator API returns structured response or feature-off 403",
    status:
      roi.status === 200
        ? ("PASS" as const)
        : roi.status === 403
          ? ("WARNING" as const)
          : roi.status < 500
            ? ("WARNING" as const)
            : ("FAIL" as const),
    details: `HTTP ${roi.status}`,
    routeOrService: "/api/roi/calculate",
    evidence: roi.snippet.slice(0, 240),
    frictionPoints: roi.status === 403 ? ["hostEconomicsFlags.roiCalculatorV1 may be off"] : [],
    blockers: roi.status >= 500 ? ["ROI endpoint server error"] : [],
  });

  const pricingSuggest = await fetchEvidence(apiUrl(ctx, "/api/ai/pricing/suggest"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ listingId: "00000000-0000-0000-0000-000000000001" }),
  });
  steps.push({
    stepId: "ai-2",
    title: "AI pricing suggestion requires auth (401 without session)",
    status: pricingSuggest.status === 401 ? ("PASS" as const) : pricingSuggest.status < 500 ? ("WARNING" as const) : ("FAIL" as const),
    details: `HTTP ${pricingSuggest.status}`,
    routeOrService: "/api/ai/pricing/suggest",
    evidence: pricingSuggest.snippet,
    frictionPoints: [],
    blockers: pricingSuggest.status >= 500 ? ["pricing suggest server error"] : [],
  });

  const intel = await fetchEvidence(apiUrl(ctx, "/api/ai/intelligence/evaluate-platform"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({}),
  });
  steps.push({
    stepId: "ai-3",
    title: "Platform intelligence endpoint fails closed without auth/config (not 5xx)",
    status: intel.status < 500 ? ("PASS" as const) : ("FAIL" as const),
    details: `HTTP ${intel.status}`,
    routeOrService: "/api/ai/intelligence/evaluate-platform",
    evidence: intel.snippet.slice(0, 200),
    frictionPoints: [],
    blockers: intel.status >= 500 ? ["server error"] : [],
  });

  return finalizeScenario({
    scenarioId: "ai-systems-v1",
    scenarioName: "AI Systems Flow",
    domain: "ai_systems",
    steps,
    recommendations: [
      "Marketing generator, negotiation sims, and contract drafting need authenticated scenarios — label as manual or Playwright.",
    ],
  });
}
