import { getPlanByKey, calculatePlatformFee } from "@/modules/business/pricing-model.service";
import { PRICING_MODEL_ENV } from "@/modules/business/pricing-model.constants";
import type { RoiCalculatorInput, RoiComparisonResult, RoiInputMode } from "./roi-calculator.types";
import { resolveConfidence, ROI_DISCLAIMERS } from "./confidence.service";
import { validateRoiInput } from "./roi-calculator.validation";
import { OPTIMIZATION_SCENARIOS } from "./assumptions.constants";

const CENTS = 100;

export function calculateCurrentGrossRevenueCents(input: RoiCalculatorInput): {
  cents: number;
  mode: RoiInputMode;
} {
  if (input.currentGrossRevenueAnnual != null && input.currentGrossRevenueAnnual > 0) {
    return { cents: Math.round(input.currentGrossRevenueAnnual * CENTS), mode: "annual_revenue" };
  }
  const nightly = input.nightlyRate ?? 0;
  if (input.bookedNightsPerYear != null && input.bookedNightsPerYear > 0) {
    return {
      cents: Math.round(nightly * input.bookedNightsPerYear * CENTS),
      mode: "nightly_booked",
    };
  }
  const occ = input.occupancyRate ?? 0;
  const avail = input.availableNightsPerYear ?? 0;
  const booked = occ * avail;
  return {
    cents: Math.round(nightly * booked * CENTS),
    mode: "nightly_occupancy",
  };
}

export function calculateCompetitorNetRevenueCents(grossCents: number, feePercent: number): number {
  const fees = Math.round(grossCents * feePercent);
  return grossCents - fees;
}

export function buildRoiComparison(input: RoiCalculatorInput): RoiComparisonResult | { error: string } {
  const v = validateRoiInput(input);
  if (!v.ok) return { error: v.error };

  const plan = getPlanByKey(String(input.lecipmPlanKey));
  if (!plan) return { error: "Unknown plan" };

  let opt: number;
  if (input.estimatedOptimizationGainPercent != null && input.estimatedOptimizationGainPercent >= 0) {
    opt = input.estimatedOptimizationGainPercent;
  } else if (input.scenarioPreset && OPTIMIZATION_SCENARIOS[input.scenarioPreset]) {
    opt = OPTIMIZATION_SCENARIOS[input.scenarioPreset].gainPercent;
  } else {
    opt = 0.15;
  }
  if (opt > 1) opt = Math.min(0.95, opt / 100);
  opt = Math.min(0.95, opt);

  const { cents: currentGrossCents, mode } = calculateCurrentGrossRevenueCents(input);
  const competitorFees = Math.round(currentGrossCents * input.currentPlatformFeePercent);
  const competitorNet = currentGrossCents - competitorFees;

  const optimizedGrossCents = Math.round(currentGrossCents * (1 + opt));

  const lecipmBookingFees = calculatePlatformFee(plan.planKey, optimizedGrossCents);
  let subscriptionAnnualCents = input.subscriptionSpendAnnualCents ?? 0;
  if (subscriptionAnnualCents === 0 && plan.planKey === "growth") {
    subscriptionAnnualCents = PRICING_MODEL_ENV.growthMonthlySubscriptionCents * 12;
  }
  if (subscriptionAnnualCents === 0 && plan.planKey === "pro" && PRICING_MODEL_ENV.proMonthlySubscriptionCents > 0) {
    subscriptionAnnualCents = PRICING_MODEL_ENV.proMonthlySubscriptionCents * 12;
  }

  const featuredAnnual = input.featuredSpendAnnualCents ?? 0;
  const lecipmNet =
    optimizedGrossCents -
    lecipmBookingFees -
    subscriptionAnnualCents -
    featuredAnnual;

  const gainAbs = lecipmNet - competitorNet;
  const gainPct = competitorNet !== 0 ? gainAbs / Math.abs(competitorNet) : null;

  const hasAnnual = input.currentGrossRevenueAnnual != null && input.currentGrossRevenueAnnual > 0;
  const hasNightly = input.nightlyRate != null && input.nightlyRate > 0;

  const confidence = resolveConfidence({
    hasAnnualRevenueOverride: hasAnnual,
    hasNightlyPath: hasNightly,
    optimizationGainPercent: opt,
  });

  const lowConfidence = confidence === "low" || opt >= 0.25;

  const result: RoiComparisonResult = {
    inputSummary: {
      mode,
      nightlyRate: input.nightlyRate ?? null,
      bookedNightsPerYear:
        input.bookedNightsPerYear ?? (input.occupancyRate != null && input.availableNightsPerYear != null
          ? input.occupancyRate * input.availableNightsPerYear
          : null),
      currentGrossRevenueAnnualCents: currentGrossCents,
    },
    currentPlatform: {
      platformName: input.currentPlatformName ?? null,
      grossRevenueCents: currentGrossCents,
      feePercent: input.currentPlatformFeePercent,
      feesPaidCents: competitorFees,
      netRevenueCents: competitorNet,
    },
    lecipm: {
      planKey: plan.planKey,
      optimizedGrossRevenueCents: optimizedGrossCents,
      bookingFeePercent: plan.bookingFeePercent,
      feesPaidCents: lecipmBookingFees,
      subscriptionSpendAnnualCents: subscriptionAnnualCents,
      featuredSpendAnnualCents: featuredAnnual,
      netRevenueCents: lecipmNet,
    },
    gain: {
      absoluteCents: gainAbs,
      percent: gainPct,
    },
    assumptions: {
      optimizationGainPercent: opt,
      lowConfidence,
      notes: [
        `Modeled optimization uplift: ${(opt * 100).toFixed(1)}% on gross before LECIPM fees.`,
        "Subscription and featured spend are your inputs where provided; otherwise Growth uses configured monthly × 12.",
      ],
    },
    confidence,
    disclaimers: [ROI_DISCLAIMERS.model, ROI_DISCLAIMERS.optimization, ROI_DISCLAIMERS.competitor],
  };

  return result;
}
