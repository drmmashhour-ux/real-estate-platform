import type { MonthRevenueBreakdown, ThreeMonthProjection, LaunchSimulationAssumptions, LaunchSimulationScenario } from "./launch-simulation.types";
import { computeBnhubMonthRevenue } from "./bnhub-revenue.service";
import { computeBrokerageMonthRevenue } from "./brokerage-revenue.service";
import { computeUpsellMonthRevenue } from "./upsell-revenue.service";

function pickM(t: { m1: number; m2: number; m3: number }, month: 1 | 2 | 3) {
  return month === 1 ? t.m1 : month === 2 ? t.m2 : t.m3;
}

export function buildThreeMonthProjection(a: LaunchSimulationAssumptions): ThreeMonthProjection {
  const months: MonthRevenueBreakdown[] = ([1, 2, 3] as const).map((month) => {
    const bn = computeBnhubMonthRevenue(a, month);
    const br = computeBrokerageMonthRevenue(a, month);
    const up = computeUpsellMonthRevenue(a, month);

    const total =
      bn.bookingFeeRevenueCad +
      bn.hostSubscriptionRevenueCad +
      bn.boostRevenueCad +
      br.subscriptionRevenueCad +
      br.leadFeeRevenueCad +
      br.successFeeRevenueCad +
      up.docAiCad;

    const row: MonthRevenueBreakdown = {
      month,
      revenueBreakdown: {
        bnhubBookingFees: bn.bookingFeeRevenueCad,
        bnhubSubscriptions: bn.hostSubscriptionRevenueCad,
        bnhubBoosts: bn.boostRevenueCad,
        brokerSubscriptions: br.subscriptionRevenueCad,
        brokerLeadFees: br.leadFeeRevenueCad,
        brokerSuccessFees: br.successFeeRevenueCad,
        otherDocAi: up.docAiCad,
      },
      totalRevenue: total,
      activeSupplyMetrics: {
        activeBnhubListings: pickM(a.activeBnhubListings, month),
        hostsOnboarded: pickM(a.hostsOnboarded, month),
      },
      activeDemandMetrics: {
        activeBrokers: pickM(a.activeBrokers, month),
      },
      modeledLodgingGmvCad: bn.modeledLodgingGmvCad,
      notes: [...bn.notes, ...br.notes, ...up.notes],
    };
    return row;
  });

  const cumulativeRevenueCad = months.reduce((s, m) => s + m.totalRevenue, 0);

  return {
    kind: "projection_estimate",
    scenario: a.scenario,
    months,
    cumulativeRevenueCad,
    disclaimers: [
      "PROJECTION — not actual results. Replace assumptions with pipeline-specific inputs.",
      "Separate modeled GMV from platform revenue in board materials.",
      ...a.notes,
    ],
  };
}

export function summarizeScenarioTotals(
  scenario: LaunchSimulationScenario,
  projections: Record<LaunchSimulationScenario, ThreeMonthProjection>
) {
  return {
    scenario,
    cumulativePlatformRevenueCad: projections[scenario].cumulativeRevenueCad,
  };
}
