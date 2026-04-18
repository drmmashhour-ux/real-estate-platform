import type { LaunchSimulationAssumptions, LaunchSimulationScenario, MonthTriplet } from "./launch-simulation.types";
import { getAssumptionRegistry } from "./assumption-registry.service";

function scaleTriplet(t: MonthTriplet, f: number): MonthTriplet {
  return {
    m1: Math.max(0, Math.round(t.m1 * f)),
    m2: Math.max(0, Math.round(t.m2 * f)),
    m3: Math.max(0, Math.round(t.m3 * f)),
  };
}

function baselineTriplet(): {
  hosts: MonthTriplet;
  listings: MonthTriplet;
  brokers: MonthTriplet;
  leadsPerBroker: MonthTriplet;
  successPerBroker: MonthTriplet;
  boosts: MonthTriplet;
} {
  return {
    hosts: { m1: 8, m2: 18, m3: 32 },
    listings: { m1: 10, m2: 24, m3: 45 },
    brokers: { m1: 4, m2: 10, m3: 18 },
    leadsPerBroker: { m1: 2, m2: 3, m3: 4 },
    successPerBroker: { m1: 0.2, m2: 0.35, m3: 0.5 },
    boosts: { m1: 3, m2: 8, m3: 14 },
  };
}

/**
 * Montreal first-3-month planning — conservative / baseline / optimistic are **multipliers on baseline triplet**, not claims of reality.
 */
export function buildMontrealAssumptions(scenario: LaunchSimulationScenario): LaunchSimulationAssumptions {
  const reg = getAssumptionRegistry();
  const b = baselineTriplet();
  const mult = scenario === "conservative" ? 0.55 : scenario === "optimistic" ? 1.45 : 1;

  const hosts = scaleTriplet(b.hosts, mult);
  const listings = scaleTriplet(b.listings, mult);
  const brokers = scaleTriplet(b.brokers, mult);
  const leads = {
    m1: Math.max(0, b.leadsPerBroker.m1 * mult),
    m2: Math.max(0, b.leadsPerBroker.m2 * mult),
    m3: Math.max(0, b.leadsPerBroker.m3 * mult),
  };
  const success = {
    m1: Math.max(0, b.successPerBroker.m1 * mult),
    m2: Math.max(0, b.successPerBroker.m2 * mult),
    m3: Math.max(0, b.successPerBroker.m3 * mult),
  };
  const boosts = scaleTriplet(b.boosts, mult);

  const occ = scenario === "conservative" ? 0.38 : scenario === "optimistic" ? 0.52 : 0.45;
  const nightly = scenario === "conservative" ? 135 : scenario === "optimistic" ? 168 : 150;

  const notes = [
    "Triplet baselines are planning placeholders — replace with your pipeline model.",
    `BNHub fee stack anchor (education): ${reg.bnhubStatedFeePercentOfLodging}% of lodging subtotal (guest+host components) — simulation uses a simplified platform-fee-% input.`,
    "Broker success fees use average gross commission × events × platform share — not tax or split-partner advice.",
  ];

  return {
    scenario,
    currency: "CAD",
    marketLabel: "Montreal (Greater Montréal) — first 90 days",
    horizonMonths: 3,
    configSources: reg.sources,
    hostsOnboarded: hosts,
    activeBnhubListings: listings,
    avgNightlyRateCad: nightly,
    avgOccupancy: occ,
    bnhubPlatformFeePercentOfLodgingGmv: reg.bnhubStatedFeePercentOfLodging,
    hostSubscriptionShare: scenario === "conservative" ? 0.12 : scenario === "optimistic" ? 0.28 : 0.18,
    hostSubscriptionMonthlyCad: reg.growthHostMonthlyCad,
    boostsPurchased: boosts,
    boostPriceCad: reg.featuredBoostCad,
    activeBrokers: brokers,
    leadsSoldPerBrokerMonth: leads,
    leadPriceCad: reg.leadPriceCad,
    successFeeEventsPerBrokerMonth: success,
    avgGrossCommissionCad: scenario === "conservative" ? 6500 : scenario === "optimistic" ? 9500 : 8000,
    platformSuccessFeeShare: 0.12,
    brokerSubscriptionMonthlyCad: 199,
    brokerSubscriptionShare: scenario === "conservative" ? 0.15 : scenario === "optimistic" ? 0.35 : 0.22,
    docAiFeeCadMonth: {
      m1: 120 * mult,
      m2: 260 * mult,
      m3: 420 * mult,
    },
    activationRateFromOutreach: scenario === "conservative" ? 0.08 : scenario === "optimistic" ? 0.18 : 0.12,
    hostToFirstBookingConversion: scenario === "conservative" ? 0.22 : scenario === "optimistic" ? 0.42 : 0.32,
    brokerToPaidConversion: scenario === "conservative" ? 0.18 : scenario === "optimistic" ? 0.4 : 0.28,
    notes,
  };
}
