import { CONFIDENCE_THRESHOLDS } from "./revenue-predictor.config";
import type {
  ConfidenceLabel,
  ImprovementTrend,
  PipelineStage,
  RevenueExplainability,
  SalespersonPredictorInput,
} from "./revenue-predictor.types";

function labelFromSamples(calls: number, outcomes: number, pipelineCents: number): ConfidenceLabel {
  if (
    calls >= CONFIDENCE_THRESHOLDS.highMinCalls &&
    outcomes >= CONFIDENCE_THRESHOLDS.highMinDeals &&
    pipelineCents > 0
  ) {
    return "HIGH";
  }
  if (
    calls >= CONFIDENCE_THRESHOLDS.mediumMinCalls &&
    outcomes >= CONFIDENCE_THRESHOLDS.mediumMinDeals
  ) {
    return "MEDIUM";
  }
  return "LOW";
}

function stageConcentration(stage: Partial<Record<PipelineStage, number>>): string[] {
  const entries = Object.entries(stage).filter(([k]) => k !== "CLOSED_WON" && k !== "CLOSED_LOST") as [
    PipelineStage,
    number,
  ][];
  const sum = entries.reduce((s, [, v]) => s + v, 0);
  if (sum < 1) return ["Stage mix not logged — forecast leans on defaults."];
  const risks: string[] = [];
  for (const [st, c] of entries) {
    const share = c / sum;
    if (share >= 0.55) {
      risks.push(`Heavy concentration in ${st} (${Math.round(share * 100)}% of counted deals) — outcome sensitive to early-stage volatility.`);
    }
  }
  return risks.length ? risks : ["Stage mix reasonably distributed where logged."];
}

/**
 * Plain-language drivers for managers — no black-box narrative.
 */
export function buildSalespersonExplainability(
  input: SalespersonPredictorInput,
  weightedCloseProbability: number,
): RevenueExplainability {
  const conf = labelFromSamples(
    input.totalCalls,
    input.closesWon + input.closesLost,
    input.pipelineValueCents,
  );

  const factorsIncreasing: string[] = [];
  const factorsReducing: string[] = [];

  if (input.improvementTrend === "up") factorsIncreasing.push("Rolling performance trend positive vs prior window.");
  if (input.trainingScore >= 72) factorsIncreasing.push("Training lab scores support execution quality.");
  if (weightedCloseProbability >= 0.28) factorsIncreasing.push("Blended close probability sits in a workable band for the pipeline size.");

  if (input.improvementTrend === "down") factorsReducing.push("Negative momentum on rolling scores increases execution risk.");
  if (input.totalCalls < CONFIDENCE_THRESHOLDS.mediumMinCalls) {
    factorsReducing.push("Thin live-call sample — win rate and calibration less stable.");
  }
  if (input.pipelineValueCents <= 0) {
    factorsReducing.push("No pipeline value captured — forecast mostly hypothetical until CRM sync.");
  }
  if (input.averageClosingScore < 58) factorsReducing.push("Closing mechanics scores drag effective conversion.");

  const coachingUpliftReason =
    input.averageClosingScore < 68 || input.objectionSuccessRate < 0.62
      ? "Room to lift conversion via objection + close coaching (scores below internal comfort band)."
      : undefined;

  const rationale =
    conf === "LOW"
      ? "LOW confidence: sparse outcomes and/or pipeline data — use directional guidance only."
      : conf === "MEDIUM"
        ? "MEDIUM confidence: enough activity to trust rank-ordering; absolute dollars still noisy."
        : "HIGH confidence: richer history and pipeline — still not a guarantee.";

  return {
    confidenceLabel: conf,
    confidenceRationale: rationale,
    factorsIncreasing: factorsIncreasing.slice(0, 8),
    factorsReducing: factorsReducing.slice(0, 8),
    stageConcentrationRisks: stageConcentration(input.conversionByStage),
    coachingUpliftReason,
  };
}

export function trendLabel(t: ImprovementTrend): string {
  if (t === "up") return "improving";
  if (t === "down") return "softening";
  return "flat";
}
