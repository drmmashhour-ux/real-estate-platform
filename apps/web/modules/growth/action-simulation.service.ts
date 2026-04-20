/**
 * Scenario outcome assembly — advisory simulation, not factual prediction.
 *
 * Contract:
 * - Do NOT claim certainty, auto-execute, invent metrics, or hide assumptions.
 * - DO stay conservative, surface risks + assumptions + uncertainty, plain-language effects, advisory-only APIs.
 */

import { buildSimulationBaseline } from "@/modules/growth/action-simulation-baseline.service";
import { applySimulationRules } from "@/modules/growth/action-simulation-rules.service";
import { buildRisksAndAssumptions } from "@/modules/growth/action-simulation-risk.service";
import type {
  ActionSimulationContext,
  SimulationBaseline,
  SimulationConfidence,
  SimulationOverall,
  SimulationOutcome,
  SimulationActionInput,
  SimulationEffectEstimate,
} from "@/modules/growth/action-simulation.types";
import {
  logSimulationBuilt,
  logSimulationLowConfidence,
} from "@/modules/growth/action-simulation-monitoring.service";

function minConfidence(a: SimulationConfidence, b: SimulationConfidence): SimulationConfidence {
  const o = { low: 0, medium: 1, high: 2 };
  return o[a] <= o[b] ? a : b;
}

/** Fold effect array into headline confidence — conservative. */
function overallConfidenceFrom(effects: SimulationEffectEstimate[], baseline: SimulationBaseline): SimulationConfidence {
  let c = baseline.confidence;
  for (const e of effects) {
    c = minConfidence(c, e.confidence);
  }
  return c;
}

/**
 * Rules:
 * - favorable: ≥2 directional "up" effects with known magnitude bands, limited uncertainty rows, bounded risks.
 * - mixed: positives coexist with negatives/uncertainty or elevated risks.
 * - weak: sparse upside or baseline trust is low without crossing hard insufficient thresholds.
 * - insufficient_data: baseline/evidence too thin — honest no-call.
 */
function classifyOverall(
  baseline: SimulationBaseline,
  effects: SimulationEffectEstimate[],
  risksLen: number,
): SimulationOverall {
  if (effects.length === 0) return "insufficient_data";

  const uncertainRows = effects.filter((e) => e.predictedDirection === "uncertain").length;
  const unknownMag = effects.filter((e) => e.predictedMagnitude === "unknown").length;
  const upSignals = effects.filter(
    (e) => e.predictedDirection === "up" && e.predictedMagnitude !== "unknown",
  ).length;
  const downSignals = effects.filter((e) => e.predictedDirection === "down").length;

  const hardInsufficient =
    baseline.confidence === "low" &&
    (baseline.warnings.length >= 6 || uncertainRows >= effects.length || unknownMag >= effects.length);

  const softInsufficient =
    baseline.confidence === "low" &&
    baseline.warnings.length >= 4 &&
    uncertainRows + unknownMag >= Math.ceil(effects.length * 0.5);

  if (hardInsufficient || softInsufficient) return "insufficient_data";

  const favorableEligible =
    upSignals >= 2 &&
    uncertainRows <= 1 &&
    unknownMag <= 1 &&
    baseline.confidence !== "low" &&
    risksLen <= 5 &&
    downSignals <= 1;

  if (favorableEligible) return "favorable";

  if (
    downSignals >= 2 ||
    (baseline.confidence === "low" && upSignals <= 1) ||
    uncertainRows >= effects.length - 1
  ) {
    return "weak";
  }

  if ((upSignals >= 1 && (downSignals >= 1 || uncertainRows >= 2)) || risksLen >= 6) return "mixed";

  if (upSignals <= 1 && baseline.confidence !== "high") return "weak";

  return "mixed";
}

export async function simulateActionOutcome(
  input: SimulationActionInput,
  context: ActionSimulationContext = { windowDays: input.windowDays ?? 14 },
): Promise<SimulationOutcome> {
  const baseline = await buildSimulationBaseline(context);
  return simulateActionOutcomeWithBaseline(input, baseline);
}

export function simulateActionOutcomeWithBaseline(
  input: SimulationActionInput,
  baseline: SimulationBaseline,
): SimulationOutcome {
  const effects = applySimulationRules(input, baseline);
  const { risks, assumptions, uncertainty } = buildRisksAndAssumptions(input, baseline, effects);
  const mergedRisks = [...risks, ...uncertainty.map((u) => `(uncertainty) ${u}`)];

  const overallRecommendation = classifyOverall(baseline, effects, mergedRisks.length);
  let overallConfidence = overallConfidenceFrom(effects, baseline);
  if (overallRecommendation === "insufficient_data") {
    overallConfidence = minConfidence(overallConfidence, "low");
  }

  const generatedAt = new Date().toISOString();

  void logSimulationBuilt({
    overall: overallRecommendation,
    effects: effects.length,
    baselineConfidence: baseline.confidence,
  });
  if (overallConfidence === "low") void logSimulationLowConfidence();

  return {
    actionId: input.id,
    overallRecommendation,
    overallConfidence,
    effects,
    risks: mergedRisks.slice(0, 12),
    assumptions,
    generatedAt,
  };
}
