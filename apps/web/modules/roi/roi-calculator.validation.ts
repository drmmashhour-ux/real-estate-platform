import type { RoiCalculatorInput } from "./roi-calculator.types";

export type ValidationResult = { ok: true } | { ok: false; error: string };

function finitePositive(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n) && n > 0;
}

function finiteNonNeg(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n) && n >= 0;
}

export function validateRoiInput(input: Partial<RoiCalculatorInput>): ValidationResult {
  const fee = input.currentPlatformFeePercent;
  if (!finiteNonNeg(fee) || fee > 0.5) {
    return { ok: false, error: "currentPlatformFeePercent must be between 0 and 0.5" };
  }

  const plan = String(input.lecipmPlanKey ?? "").toLowerCase();
  if (!["free", "pro", "growth"].includes(plan)) {
    return { ok: false, error: "lecipmPlanKey must be free, pro, or growth" };
  }

  if (input.scenarioPreset != null && !["conservative", "standard", "aggressive"].includes(input.scenarioPreset)) {
    return { ok: false, error: "scenarioPreset must be conservative, standard, or aggressive" };
  }

  const rev = input.currentGrossRevenueAnnual;
  const nightly = input.nightlyRate;
  const booked = input.bookedNightsPerYear;
  const occ = input.occupancyRate;
  const avail = input.availableNightsPerYear;

  if (rev != null) {
    if (!finitePositive(rev)) return { ok: false, error: "currentGrossRevenueAnnual must be positive" };
    return { ok: true };
  }

  if (!finitePositive(nightly ?? 0)) {
    return { ok: false, error: "nightlyRate is required and must be positive (or provide currentGrossRevenueAnnual)" };
  }

  if (booked != null) {
    if (!finitePositive(booked) || booked > 366) return { ok: false, error: "bookedNightsPerYear invalid" };
    return { ok: true };
  }

  if (occ != null && avail != null) {
    if (occ <= 0 || occ > 1) return { ok: false, error: "occupancyRate must be between 0 and 1" };
    if (!finitePositive(avail) || avail > 366) return { ok: false, error: "availableNightsPerYear invalid" };
    return { ok: true };
  }

  return { ok: false, error: "Provide bookedNightsPerYear or occupancyRate+availableNightsPerYear, or currentGrossRevenueAnnual" };
}
