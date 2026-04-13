import { clamp01 } from "./normalize";

/**
 * Conversion likelihood proxy (0–1) from component signals — mirrors autopilot "conversion" theme without ML.
 * TODO v2: ML-based conversion scoring; fraud score integration; cohort calibration.
 */
export function conversionLikelihoodProxy01(input: {
  quality01: number;
  trust01: number;
  priceCompetitiveness01: number;
  engagement01: number;
  freshness01: number;
}): number {
  const q = clamp01(input.quality01);
  const t = clamp01(input.trust01);
  const p = clamp01(input.priceCompetitiveness01);
  const e = clamp01(input.engagement01);
  const f = clamp01(input.freshness01);
  return clamp01(q * 0.22 + t * 0.24 + p * 0.2 + e * 0.2 + f * 0.14);
}
