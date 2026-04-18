/**
 * LECIPM — 3-month Montreal launch revenue simulation (ESTIMATES ONLY).
 * All numbers are projections unless explicitly labeled actuals in consuming UI.
 */

export type LaunchSimulationScenario = "conservative" | "baseline" | "optimistic";

export type MonthTriplet = { m1: number; m2: number; m3: number };

export type LaunchSimulationAssumptions = {
  scenario: LaunchSimulationScenario;
  currency: "CAD";
  marketLabel: string;
  horizonMonths: 3;
  /** Config lineage for audit */
  configSources: string[];
  hostsOnboarded: MonthTriplet;
  activeBnhubListings: MonthTriplet;
  avgNightlyRateCad: number;
  /** Booked nights fraction (0–1) */
  avgOccupancy: number;
  /**
   * Platform booking-fee proxy: % of lodging GMV retained as platform revenue (guest+host path simplified).
   * See `assumption-registry.service.ts` for BNHub anchor notes.
   */
  bnhubPlatformFeePercentOfLodgingGmv: number;
  /** Share of hosts paying a monthly host tool subscription */
  hostSubscriptionShare: number;
  hostSubscriptionMonthlyCad: number;
  boostsPurchased: MonthTriplet;
  boostPriceCad: number;
  activeBrokers: MonthTriplet;
  leadsSoldPerBrokerMonth: MonthTriplet;
  leadPriceCad: number;
  successFeeEventsPerBrokerMonth: MonthTriplet;
  avgGrossCommissionCad: number;
  /** Platform take on gross commission $ */
  platformSuccessFeeShare: number;
  brokerSubscriptionMonthlyCad: number;
  brokerSubscriptionShare: number;
  docAiFeeCadMonth: MonthTriplet;
  /** Model inputs — not measured CAC */
  activationRateFromOutreach: number;
  hostToFirstBookingConversion: number;
  brokerToPaidConversion: number;
  notes: string[];
};

export type MonthRevenueBreakdown = {
  month: 1 | 2 | 3;
  revenueBreakdown: {
    bnhubBookingFees: number;
    bnhubSubscriptions: number;
    bnhubBoosts: number;
    brokerSubscriptions: number;
    brokerLeadFees: number;
    brokerSuccessFees: number;
    otherDocAi: number;
  };
  totalRevenue: number;
  activeSupplyMetrics: {
    activeBnhubListings: number;
    hostsOnboarded: number;
  };
  activeDemandMetrics: {
    activeBrokers: number;
  };
  /** Lodging GMV modeled (not platform revenue) */
  modeledLodgingGmvCad: number;
  notes: string[];
};

export type ThreeMonthProjection = {
  kind: "projection_estimate";
  scenario: LaunchSimulationScenario;
  months: MonthRevenueBreakdown[];
  cumulativeRevenueCad: number;
  disclaimers: string[];
};

export type UnitEconomicsSummary = {
  kind: "unit_economics_estimate";
  projectedPlatformRevenue3mCad: number;
  modeledLodgingGmv3mCad: number;
  avgRevenuePerHost3mCad: number | null;
  avgRevenuePerBroker3mCad: number | null;
  cacCad: number | null;
  cacNote: string;
  paybackNote: string;
  notes: string[];
};
