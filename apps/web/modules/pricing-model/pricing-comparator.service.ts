import { calculatePlatformFee, getPlanByKey } from "@/modules/business/pricing-model.service";
import type { CompetitorComparisonInput } from "./pricing-model.types";

export type ComparatorResult = {
  grossBookingCents: number;
  competitor: { feePercent: number; feesCents: number; netCents: number };
  lecipm: {
    planKey: string;
    bookingFeePercent: number;
    feesCents: number;
    netCents: number;
  };
  comparisonNotes: string[];
};

/**
 * Side-by-side host-net comparison — competitor fee % is **user-declared**, never sourced as fact.
 */
export function compareHostNetVersusDeclaredCompetitor(input: CompetitorComparisonInput): ComparatorResult | { error: string } {
  const plan = getPlanByKey(input.lecipmPlanKey);
  if (!plan) return { error: "Unknown LECIPM plan" };
  const g = Math.max(0, Math.round(input.grossBookingCents));
  if (g === 0) return { error: "grossBookingCents must be positive" };

  const compPct = Math.max(0, Math.min(0.5, input.competitorFeePercent));
  const compFees = Math.round(g * compPct);
  const compNet = g - compFees;

  const lecFees = calculatePlatformFee(plan.planKey, g);
  const lecNet = g - lecFees;

  return {
    grossBookingCents: g,
    competitor: { feePercent: compPct, feesCents: compFees, netCents: compNet },
    lecipm: {
      planKey: plan.planKey,
      bookingFeePercent: plan.bookingFeePercent,
      feesCents: lecFees,
      netCents: lecNet,
    },
    comparisonNotes: [
      "Competitor fee is your input — LECIPM does not scrape or assert OTA fee schedules.",
      "LECIPM net uses the configured host plan booking fee on the same gross (see env `LECIPM_*_BOOKING_FEE_PERCENT`).",
    ],
  };
}
