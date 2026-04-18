import type { LecipmPlanKey } from "@/modules/business/pricing-model.types";
import type { ConfidenceLevel } from "./confidence.service";

export type RoiInputMode = "nightly_booked" | "nightly_occupancy" | "annual_revenue";

export type RoiCalculatorInput = {
  nightlyRate?: number;
  bookedNightsPerYear?: number;
  occupancyRate?: number;
  availableNightsPerYear?: number;
  currentGrossRevenueAnnual?: number;
  currentPlatformFeePercent: number;
  lecipmPlanKey: LecipmPlanKey | string;
  estimatedOptimizationGainPercent?: number;
  featuredSpendAnnualCents?: number;
  subscriptionSpendAnnualCents?: number;
  /** Display only — not used in fee math. */
  currentPlatformName?: string;
  listingType?: string;
  city?: string;
  /** When set and optimization % omitted, uses assumptions.constants scenario gain. */
  scenarioPreset?: "conservative" | "standard" | "aggressive";
};

export type RoiComparisonResult = {
  inputSummary: {
    mode: RoiInputMode;
    nightlyRate: number | null;
    bookedNightsPerYear: number | null;
    currentGrossRevenueAnnualCents: number;
  };
  currentPlatform: {
    platformName?: string | null;
    grossRevenueCents: number;
    feePercent: number;
    feesPaidCents: number;
    netRevenueCents: number;
  };
  lecipm: {
    planKey: string;
    optimizedGrossRevenueCents: number;
    bookingFeePercent: number;
    feesPaidCents: number;
    subscriptionSpendAnnualCents: number;
    featuredSpendAnnualCents: number;
    netRevenueCents: number;
  };
  gain: {
    absoluteCents: number;
    percent: number | null;
  };
  assumptions: {
    optimizationGainPercent: number;
    lowConfidence: boolean;
    notes: string[];
  };
  confidence: ConfidenceLevel;
  disclaimers: string[];
};
