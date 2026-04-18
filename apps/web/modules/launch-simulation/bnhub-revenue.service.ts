import type { LaunchSimulationAssumptions } from "./launch-simulation.types";

export type BnhubMonth = {
  modeledLodgingGmvCad: number;
  bookingFeeRevenueCad: number;
  hostSubscriptionRevenueCad: number;
  boostRevenueCad: number;
  notes: string[];
};

function pickM(t: { m1: number; m2: number; m3: number }, month: 1 | 2 | 3) {
  return month === 1 ? t.m1 : month === 2 ? t.m2 : t.m3;
}

/**
 * BNHub lines — **estimated** from listings × occupancy × ADR and fee %.
 */
export function computeBnhubMonthRevenue(a: LaunchSimulationAssumptions, month: 1 | 2 | 3): BnhubMonth {
  const days = 30;
  const listings = pickM(a.activeBnhubListings, month);
  const bookedNights = listings * days * a.avgOccupancy;
  const lodgingGmv = bookedNights * a.avgNightlyRateCad;
  const feePct = a.bnhubPlatformFeePercentOfLodgingGmv / 100;
  const bookingFees = lodgingGmv * feePct;

  const hosts = pickM(a.hostsOnboarded, month);
  const payingHosts = hosts * a.hostSubscriptionShare;
  const subs = payingHosts * a.hostSubscriptionMonthlyCad;

  const boosts = pickM(a.boostsPurchased, month) * a.boostPriceCad;

  return {
    modeledLodgingGmvCad: lodgingGmv,
    bookingFeeRevenueCad: bookingFees,
    hostSubscriptionRevenueCad: subs,
    boostRevenueCad: boosts,
    notes: [
      "Lodging GMV = active listings × 30 × occupancy × ADR (simplified).",
      "Booking fee revenue applies bnhubPlatformFeePercentOfLodgingGmv to lodging GMV as a single proxy — tune to match your finance model.",
    ],
  };
}
