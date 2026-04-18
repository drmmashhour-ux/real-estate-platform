import type { LaunchSimulationAssumptions } from "./launch-simulation.types";

function pickM(t: { m1: number; m2: number; m3: number }, month: 1 | 2 | 3) {
  return month === 1 ? t.m1 : month === 2 ? t.m2 : t.m3;
}

export type BrokerageMonth = {
  subscriptionRevenueCad: number;
  leadFeeRevenueCad: number;
  successFeeRevenueCad: number;
  notes: string[];
};

export function computeBrokerageMonthRevenue(a: LaunchSimulationAssumptions, month: 1 | 2 | 3): BrokerageMonth {
  const brokers = pickM(a.activeBrokers, month);
  const leads = pickM(a.leadsSoldPerBrokerMonth, month);
  const succ = pickM(a.successFeeEventsPerBrokerMonth, month);

  const leadRev = brokers * leads * a.leadPriceCad;
  const successRev = brokers * succ * a.avgGrossCommissionCad * a.platformSuccessFeeShare;
  const subRev = brokers * a.brokerSubscriptionShare * a.brokerSubscriptionMonthlyCad;

  return {
    subscriptionRevenueCad: subRev,
    leadFeeRevenueCad: leadRev,
    successFeeRevenueCad: successRev,
    notes: [
      "Success fee revenue = brokers × success events/mo × avg gross commission × platformSuccessFeeShare — illustrative.",
    ],
  };
}
