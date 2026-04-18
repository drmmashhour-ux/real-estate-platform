import type { LecipmPlanKey } from "@/modules/business/pricing-model.types";

export type PlanMix = Partial<Record<LecipmPlanKey, number>>;

export type MontrealSimulationInput = {
  hostCount: number;
  avgAnnualHostRevenueCents: number;
  competitorFeePercent: number;
  lecipmPlanMix: PlanMix;
  estimatedOptimizationGainPercent: number;
  avgFeaturedSpendPerHostAnnualCents: number;
  avgSubscriptionSpendPerHostAnnualCents: number;
};

export type MontrealSimulationOutput = {
  hosts: {
    totalHosts: number;
    avgAnnualRevenueCents: number;
    totalGrossRevenueCents: number;
  };
  competitor: {
    feePercent: number;
    totalFeesPaidCents: number;
    totalNetRevenueToHostsCents: number;
  };
  lecipm: {
    optimizedGrossRevenueCents: number;
    feeRevenueCents: number;
    subscriptionRevenueCents: number;
    featuredRevenueCents: number;
    totalPlatformRevenueCents: number;
    totalNetRevenueToHostsCents: number;
  };
  hostBenefit: {
    totalGainToHostsCents: number;
    gainPerHostAverageCents: number;
    percentImprovement: number | null;
  };
  assumptions: string[];
  disclaimer: string;
};
