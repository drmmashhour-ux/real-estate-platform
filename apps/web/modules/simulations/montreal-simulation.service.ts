import { calculatePlatformFee } from "@/modules/business/pricing-model.service";
import type { LecipmPlanKey } from "@/modules/business/pricing-model.types";
import type { MontrealSimulationInput, MontrealSimulationOutput, PlanMix } from "./launch-simulation.types";

function normalizeMix(mix: PlanMix): Record<LecipmPlanKey, number> {
  const base: Record<LecipmPlanKey, number> = { free: 0.2, pro: 0.6, growth: 0.2 };
  const merged = { ...base, ...mix };
  const sum = merged.free + merged.pro + merged.growth;
  if (sum <= 0) return base;
  return {
    free: merged.free / sum,
    pro: merged.pro / sum,
    growth: merged.growth / sum,
  };
}

/**
 * Internal batch simulation — not a market forecast.
 */
export function simulateHostEconomicsBatch(input: MontrealSimulationInput): MontrealSimulationOutput {
  const n = Math.max(0, Math.floor(input.hostCount));
  const avgGross = Math.max(0, input.avgAnnualHostRevenueCents);
  const totalGross = n * avgGross;

  const compFees = Math.round(totalGross * input.competitorFeePercent);
  const compNet = totalGross - compFees;

  const optGross = Math.round(totalGross * (1 + input.estimatedOptimizationGainPercent));
  const mix = normalizeMix(input.lecipmPlanMix);

  let feeRev = 0;
  (["free", "pro", "growth"] as const).forEach((k) => {
    const segmentGross = Math.round(optGross * mix[k]);
    feeRev += calculatePlatformFee(k, segmentGross);
  });

  const growthHosts = n * mix.growth;
  const subscriptionRevenueCents = Math.round(growthHosts * input.avgSubscriptionSpendPerHostAnnualCents);
  const featuredRevenueCents = Math.round(n * input.avgFeaturedSpendPerHostAnnualCents);

  const totalPlatformRevenueCents = feeRev + subscriptionRevenueCents + featuredRevenueCents;
  const hostNetLecipm = optGross - feeRev - subscriptionRevenueCents - featuredRevenueCents;

  const gain = hostNetLecipm - compNet;
  const gainPer = n > 0 ? Math.round(gain / n) : 0;
  const pct = compNet !== 0 ? gain / Math.abs(compNet) : null;

  return {
    hosts: {
      totalHosts: n,
      avgAnnualRevenueCents: avgGross,
      totalGrossRevenueCents: totalGross,
    },
    competitor: {
      feePercent: input.competitorFeePercent,
      totalFeesPaidCents: compFees,
      totalNetRevenueToHostsCents: compNet,
    },
    lecipm: {
      optimizedGrossRevenueCents: optGross,
      feeRevenueCents: feeRev,
      subscriptionRevenueCents,
      featuredRevenueCents,
      totalPlatformRevenueCents,
      totalNetRevenueToHostsCents: hostNetLecipm,
    },
    hostBenefit: {
      totalGainToHostsCents: gain,
      gainPerHostAverageCents: gainPer,
      percentImprovement: pct,
    },
    assumptions: [
      "Internal scenario — not verified market demand for Montreal.",
      `Plan mix: Free ${(mix.free * 100).toFixed(0)}% · Pro ${(mix.pro * 100).toFixed(0)}% · Growth ${(mix.growth * 100).toFixed(0)}%.`,
      `Gross uplift ${(input.estimatedOptimizationGainPercent * 100).toFixed(1)}% applied uniformly (configurable).`,
      "Subscription spend attributed to Growth-tier host count only.",
    ],
    disclaimer:
      "Scenario planning only. Actual results depend on acquisition, mix, taxes, payment fees, and listing quality.",
  };
}

export function buildMontrealLaunchScenario(presetHosts: 25 | 50 | 100 | 250 | 500): MontrealSimulationOutput {
  return simulateHostEconomicsBatch({
    hostCount: presetHosts,
    avgAnnualHostRevenueCents: 2_800_000,
    competitorFeePercent: 0.14,
    lecipmPlanMix: { free: 0.25, pro: 0.55, growth: 0.2 },
    estimatedOptimizationGainPercent: 0.12,
    avgFeaturedSpendPerHostAnnualCents: 120_00,
    avgSubscriptionSpendPerHostAnnualCents: 400_00,
  });
}

export const MONTREAL_PRESETS = [25, 50, 100, 250, 500] as const;
