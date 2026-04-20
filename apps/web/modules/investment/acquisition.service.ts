import { clamp, round2 } from "@/modules/investment/recommendation-math";
import { buildScenarios } from "@/modules/investment/scenario-builder.service";
import { classifyInvestment } from "@/modules/investment/underwriting-decision.service";
import { runUnderwriting } from "@/modules/investment/underwriting.service";
import type { UnderwritingInput } from "@/modules/investment/underwriting.types";

const DISCLAIMER =
  "Outputs depend entirely on your assumptions. They are not guaranteed results, not a market appraisal, and not legal or tax advice.";

export type AcquisitionAnalysisPayload = {
  assumptions: UnderwritingInput;
  result: ReturnType<typeof runUnderwriting>;
  scenarios: ReturnType<typeof buildScenarios>;
  score: number;
  recommendation: "buy" | "caution" | "reject";
  confidenceScore: number;
  disclaimer: string;
};

function sanitizeInput(raw: Partial<UnderwritingInput>): UnderwritingInput {
  const purchasePrice = Math.max(0, Number(raw.purchasePrice) || 0);
  const adr = Math.max(0, Number(raw.adr) || 0);
  let occupancyRate = Number(raw.occupancyRate);
  if (!Number.isFinite(occupancyRate)) occupancyRate = 0;
  if (occupancyRate > 1 && occupancyRate <= 100) occupancyRate = occupancyRate / 100;
  occupancyRate = clamp(occupancyRate, 0, 1);
  const monthlyCost = Math.max(0, Number(raw.monthlyCost) || 0);
  let financingRate: number | undefined;
  if (raw.financingRate !== undefined && raw.financingRate !== null && Number.isFinite(Number(raw.financingRate))) {
    let fr = Number(raw.financingRate);
    if (fr > 1) fr = fr / 100;
    financingRate = clamp(fr, 0, 1);
  }
  const downPayment =
    raw.downPayment !== undefined && raw.downPayment !== null && Number.isFinite(Number(raw.downPayment))
      ? Math.max(0, Number(raw.downPayment))
      : undefined;

  return {
    purchasePrice,
    adr,
    occupancyRate,
    monthlyCost,
    financingRate,
    downPayment,
  };
}

export function computeConfidenceScore(input: UnderwritingInput): number {
  let c = 0.58;
  if (input.financingRate !== undefined) c += 0.06;
  if (input.downPayment !== undefined) c += 0.06;
  if (input.purchasePrice > 0 && input.adr > 0 && input.monthlyCost >= 0) c += 0.06;
  return clamp(round2(c), 0, 1);
}

/** Full deterministic underwriting + labelled scenarios + stance (rules-only). */
export function runAcquisitionAnalysis(raw: Partial<UnderwritingInput>): AcquisitionAnalysisPayload {
  const assumptions = sanitizeInput(raw);
  const result = runUnderwriting(assumptions);
  const scenarios = buildScenarios(assumptions);
  const decision = classifyInvestment(result);
  const confidenceScore = computeConfidenceScore(assumptions);

  return {
    assumptions,
    result,
    scenarios,
    score: decision.score,
    recommendation: decision.recommendation,
    confidenceScore,
    disclaimer: DISCLAIMER,
  };
}
