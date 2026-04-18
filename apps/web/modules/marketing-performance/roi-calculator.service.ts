/**
 * ROI helpers — revenue and spend must come from recorded events or explicit inputs.
 * ROI = revenue / spend when spend > 0.
 */
export type RoiInputs = {
  revenueCents: number;
  spendCents: number;
};

export function computeRoiPercent(inputs: RoiInputs): number | null {
  if (inputs.spendCents <= 0) return null;
  return ((inputs.revenueCents - inputs.spendCents) / inputs.spendCents) * 100;
}

export function computeCostPerUnit(spendCents: number, units: number): number | null {
  if (units <= 0 || spendCents < 0) return null;
  return spendCents / units;
}

/** Stage conversion: e.g. leads / clicks — null if denominator is zero. */
export function computeStageRate(numerator: number, denominator: number): number | null {
  if (denominator <= 0 || numerator < 0) return null;
  return Math.round((numerator / denominator) * 10000) / 10000;
}

/** ROI helpers bundle for dashboards — all inputs must be from reported events. */
export function summarizeUnitEconomics(input: {
  revenueCents: number;
  spendCents: number;
  leadCount: number;
  bookingCount: number;
}) {
  const roiPercent = computeRoiPercent({
    revenueCents: input.revenueCents,
    spendCents: input.spendCents,
  });
  return {
    revenueCents: input.revenueCents,
    spendCents: input.spendCents,
    roiPercent,
    costPerLeadCents: computeCostPerUnit(input.spendCents, input.leadCount),
    costPerBookingCents: computeCostPerUnit(input.spendCents, input.bookingCount),
  };
}
