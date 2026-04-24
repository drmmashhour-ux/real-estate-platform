import type {
  PredictedMetrics,
  ScenarioInput,
  SimulationBaseline,
  SimulationConfidence,
  WhatIfResult,
} from "./simulation.types";
import { buildRecommendedActions } from "./simulation-impact.service";
import { assessRiskWarnings } from "./simulation-impact.service";
import { confidenceFromScenario } from "./simulation-impact.service";

const ASSUMPTIONS = [
  "Demand and revenue are modeled with diminishing returns; not a forecast of booked revenue.",
  "Trust and dispute signals use linear blends on latest snapshots — extreme knobs reduce confidence.",
  "Regional selection filters labels only unless City-level data is present in the baseline.",
  "Autopilot level reduces human workload in simulation but can increase governance risk if mis-set.",
] as const;

/**
 * Core what-if transform — pure function, safe to run on any baseline snapshot.
 */
export function runWhatIfSimulation(
  baseline: SimulationBaseline,
  scenario: ScenarioInput,
): WhatIfResult {
  const {
    leadVolumeMultiplier: L,
    responseSpeedChange: R,
    pricingAdjustment: P,
    marketingBoost: M,
    trustThresholdChange: Tt,
    autopilotLevel: A,
  } = scenario;

  const demandFactor = Math.max(0.2, L) * (1 + M * 0.2);
  // Revenue: pipeline * pricing * sqrt(demand) — conservative elasticity
  const revenueChangePct = clamp(
    (Math.sqrt(demandFactor) - 1) * 60 + P * 40 + R * 8,
    -45,
    80,
  );

  // Conversion: faster response + marketing help; stricter trust gate hurts top-of-funnel pass rate
  const conversionChangePts = clamp(
    -R * 12 + M * 4 + Tt * -0.15 + (L - 1) * 3,
    -18,
    25,
  );

  // Dispute risk: higher price pressure + fast autopilot without ops bandwidth
  const disputeRiskChangePts = clamp(
    P * 18 - R * 6 + A * 1.2 + (M > 0.6 ? 2 : 0),
    -25,
    35,
  );

  // Trust: faster fulfillment narrative + stricter admin gate simulation
  const trustChangePts = clamp(
    R * 4 - P * 3 + Tt * 0.4 - A * 0.3,
    -12,
    10,
  );

  // Workload: more leads + less autopilot = more work
  const workloadChangePct = clamp(
    (L - 1) * 22 - A * 9 + (R < 0 ? 4 : -2),
    -40,
    60,
  );

  const predictedMetrics: PredictedMetrics = {
    revenueChangePct: round1(revenueChangePct),
    conversionChangePts: round1(conversionChangePts),
    disputeRiskChangePts: round1(disputeRiskChangePts),
    trustChangePts: round1(trustChangePts),
    workloadChangePct: round1(workloadChangePct),
    narrative: buildNarrative(revenueChangePct, conversionChangePts, disputeRiskChangePts, trustChangePts),
  };

  const confidenceLevel: SimulationConfidence = confidenceFromScenario(scenario);
  const riskWarnings = assessRiskWarnings(scenario, predictedMetrics, baseline);
  const recommendedActions = buildRecommendedActions(scenario, predictedMetrics, riskWarnings);

  return {
    simulated: true,
    scenario: { ...scenario },
    baseline,
    predictedMetrics,
    confidenceLevel,
    riskWarnings,
    recommendedActions,
    assumptions: [...ASSUMPTIONS],
  };
}

function buildNarrative(
  rev: number,
  conv: number,
  dispute: number,
  trust: number,
): string {
  const parts: string[] = [];
  if (rev >= 3) parts.push(`Modeled revenue uplift near +${round1(rev)}% from demand + pricing levers.`);
  else if (rev <= -3) parts.push(`Modeled revenue pressure about ${round1(rev)}% under current mix.`);
  else parts.push("Modeled revenue near flat — marginal moves across levers net out.");

  if (conv >= 1) parts.push(`Conversion could gain ~${round1(Math.abs(conv))} points with faster response.`);
  if (dispute >= 3) parts.push("Dispute risk edges up — tighten fulfillment and comms if you raise pricing.");
  if (trust <= -2) parts.push("Trust may soften slightly — review threshold and no-show flow.");
  if (parts.length < 2 && trust >= 1) parts.push("Trust may improve modestly with operational speed.");
  return parts.join(" ");
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
