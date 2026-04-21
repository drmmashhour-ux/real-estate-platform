import { clamp, round2, safeDivide } from "@/modules/investment/recommendation-math";

export type SimpleRoiInputs = {
  /** Major currency units (e.g. CAD list / purchase). */
  basisMajor: number;
  /** Optional annual gross rent / revenue proxy in major units. */
  annualIncomeMajor?: number | null;
};

/**
 * Naive yield-style ROI proxy — **not** a forecast; used for ranking only when rent/income hints exist.
 */
export function estimateYieldRoi(input: SimpleRoiInputs): number | null {
  const basis = input.basisMajor;
  if (!basis || basis <= 0) return null;
  const income = input.annualIncomeMajor ?? null;
  if (income == null || income <= 0) return null;
  return round2(safeDivide(income, basis));
}

/**
 * Maps composite score + yield hint into an “expected ROI” display band (still not a prediction).
 */
export function bandExpectedRoi(params: {
  compositeScore01: number;
  yieldRoi: number | null;
}): number {
  const base = 0.04 + params.compositeScore01 * 0.12;
  if (params.yieldRoi != null) {
    const blended = base * 0.55 + clamp(params.yieldRoi, 0, 0.35) * 0.45;
    return round2(blended);
  }
  return round2(base);
}
