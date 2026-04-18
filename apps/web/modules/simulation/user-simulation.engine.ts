/**
 * LECIPM Real User Simulation v1 — orchestrates scenarios + detectors + optional DB signals.
 */
import { prisma } from "@/lib/db";
import { ALL_SCENARIO_FACTORIES } from "@/modules/simulation/behavior-scenarios.service";
import { detectDropOffs } from "@/modules/simulation/dropoff-detector.service";
import { mergeDropOffs } from "@/modules/simulation/dropoff-analysis.service";
import { detectFrictionFromSteps, mergeFrictionPoints } from "@/modules/simulation/friction-analysis.service";
import type {
  ConfusionEvent,
  PersonaJourneyResult,
  UserSimulationReport,
} from "@/modules/simulation/user-simulation.types";
import { personaSpecificTips, recommendationsForFriction } from "@/modules/simulation/ux-recommendation.service";

function extractConfusionEvents(steps: PersonaJourneyResult["steps"]): ConfusionEvent[] {
  const out: ConfusionEvent[] = [];
  for (const s of steps) {
    if (s.mood === "confused" || s.mistake) {
      out.push({
        at: s.at,
        stepId: s.id,
        description: s.mistake ? `Mistake/retry: ${s.action}` : `Confusion: ${s.action}`,
      });
    }
  }
  return out;
}

function enrichJourney(j: PersonaJourneyResult): PersonaJourneyResult {
  const frictionPoints = detectFrictionFromSteps(j.steps, { journey: j.journey, persona: j.persona });
  const dropOffPoints = detectDropOffs(
    j.steps,
    j.conversionStatus === "converted"
      ? "converted"
      : j.conversionStatus === "partial"
        ? "partial"
        : j.conversionStatus === "blocked"
          ? "blocked"
          : j.conversionStatus === "unknown"
            ? "unknown"
            : "abandoned",
  );
  const confusionEvents = extractConfusionEvents(j.steps);
  const recFriction = recommendationsForFriction(frictionPoints);
  const recPersona = personaSpecificTips(j.persona);
  const recommendations = [...new Set([...recFriction, ...recPersona, ...j.recommendations])];
  return {
    ...j,
    frictionPoints,
    dropOffPoints,
    confusionEvents,
    recommendations,
  };
}

function readinessScore(allFriction: ReturnType<typeof mergeFrictionPoints>): number {
  let score = 100;
  for (const f of allFriction) {
    if (f.severity === "high") score -= 12;
    else if (f.severity === "medium") score -= 6;
    else score -= 2;
  }
  return Math.max(0, Math.min(100, score));
}

function conversionBlockers(journeys: PersonaJourneyResult[]): string[] {
  const blockers: string[] = [];
  for (const j of journeys) {
    if (j.conversionStatus === "abandoned" && j.journey.includes("checkout")) {
      blockers.push(`Payment hesitation / abandon: ${j.journey} (${j.persona})`);
    }
    if (j.frictionPoints.some((f) => f.category === "checkout" && f.severity === "high")) {
      blockers.push(`Checkout friction (high): ${j.journey}`);
    }
    if (j.frictionPoints.some((f) => f.category === "onboarding" && f.severity === "high")) {
      blockers.push(`Onboarding abandon risk: ${j.persona} / ${j.journey}`);
    }
  }
  return [...new Set(blockers)];
}

export async function runUserSimulationEngine(): Promise<UserSimulationReport> {
  const journeys: PersonaJourneyResult[] = ALL_SCENARIO_FACTORIES.map((fn) => enrichJourney(fn()));
  const allFriction = mergeFrictionPoints(journeys.map((j) => j.frictionPoints));
  const allDropOffs = mergeDropOffs(journeys.map((j) => j.dropOffPoints));
  const recommendations = [
    ...new Set(journeys.flatMap((j) => j.recommendations)),
    ...recommendationsForFriction(allFriction),
  ];

  const notes: string[] = [
    "Scores and narratives are heuristic — validate with product analytics, session replay, and user research.",
    "No fabricated success: conversionStatus comes from scripted persona outcomes plus detectors.",
  ];

  try {
    const listingSample = await prisma.shortTermListing.count();
    const dealCount = await prisma.deal.count();
    notes.push(
      `DB snapshot (read-only): shortTermListing count=${listingSample}, deal count=${dealCount} — use for triangulation, not as UX proof.`,
    );
  } catch (e) {
    notes.push(`DB snapshot skipped: ${e instanceof Error ? e.message : String(e)}`);
  }

  return {
    generatedAt: new Date().toISOString(),
    engineVersion: "lecipm_user_simulation_v1",
    personasTested: [...new Set(journeys.map((j) => j.persona))],
    journeys,
    allFrictionPoints: allFriction,
    allDropOffs,
    conversionBlockers: conversionBlockers(journeys),
    recommendations: [...new Set(recommendations)],
    overallReadinessScore: readinessScore(allFriction),
    notes,
  };
}
