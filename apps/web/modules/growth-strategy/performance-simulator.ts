import type { AllocatedCampaignRow, BudgetEngineResult } from "./budget-engine.service";

export type SimulationInput = {
  campaigns: Pick<
    AllocatedCampaignRow,
    "budgetCad" | "expectedCpcCad" | "expectedConversionRate" | "target" | "name" | "id"
  >[];
  /** Expected average booking GMV in CAD (guest-paid stay). Conservative default. */
  avgBookingValueCad?: number;
  /** Optional platform take rate on BNHub (0–1) for revenue estimate. */
  bnhubTakeRate?: number;
};

export type CampaignSimulationRow = {
  id: string;
  name: string;
  target: AllocatedCampaignRow["target"];
  budgetCad: number;
  cpcCad: number;
  conversionRate: number;
  estimatedClicks: number;
  estimatedConversions: number;
  /** Only BNHub row gets non-zero when using take-rate model. */
  estimatedRevenueCad: number;
  estimatedRoi: number | null;
};

export type PerformanceSimulationResult = {
  rows: CampaignSimulationRow[];
  totals: {
    budgetCad: number;
    estimatedClicks: number;
    estimatedConversions: number;
    estimatedRevenueCad: number;
    blendedRoi: number | null;
  };
  formula: string;
};

const DEFAULT_AVG_BOOKING = 185;
const DEFAULT_TAKE = 0.12;

/**
 * Simulate clicks, conversions, and revenue from allocated rows.
 * Revenue is attributed only to BNHub booking line using avg booking × take rate × booking-like conversions (proxy).
 */
export function simulateCampaignPerformance(input: SimulationInput): PerformanceSimulationResult {
  const avgBooking = input.avgBookingValueCad ?? DEFAULT_AVG_BOOKING;
  const take = input.bnhubTakeRate ?? DEFAULT_TAKE;

  const rows: CampaignSimulationRow[] = input.campaigns.map((c) => {
    const cpc = c.expectedCpcCad > 0 ? c.expectedCpcCad : 1.2;
    const cr = c.expectedConversionRate;
    const clicks = Math.max(0, Math.floor(c.budgetCad / cpc));
    const conv = Math.round(clicks * cr * 100) / 100;
    let revenue = 0;
    if (c.target === "bnhub_booking") {
      /** Proxy: not all conversions are paid bookings — apply 0.35 factor to conversions→paid stays. */
      const paidBookingFactor = 0.35;
      revenue = Math.round(conv * paidBookingFactor * avgBooking * take * 100) / 100;
    }
    const roi = c.budgetCad > 0 ? Math.round((revenue / c.budgetCad) * 1000) / 1000 : null;
    return {
      id: c.id,
      name: c.name,
      target: c.target,
      budgetCad: c.budgetCad,
      cpcCad: cpc,
      conversionRate: cr,
      estimatedClicks: clicks,
      estimatedConversions: conv,
      estimatedRevenueCad: revenue,
      estimatedRoi: roi,
    };
  });

  const budgetCad = rows.reduce((a, r) => a + r.budgetCad, 0);
  const estimatedClicks = rows.reduce((a, r) => a + r.estimatedClicks, 0);
  const estimatedConversions = rows.reduce((a, r) => a + r.estimatedConversions, 0);
  const estimatedRevenueCad = Math.round(rows.reduce((a, r) => a + r.estimatedRevenueCad, 0) * 100) / 100;
  const blendedRoi =
    budgetCad > 0 ? Math.round((estimatedRevenueCad / budgetCad) * 1000) / 1000 : null;

  return {
    rows,
    totals: {
      budgetCad,
      estimatedClicks,
      estimatedConversions,
      estimatedRevenueCad,
      blendedRoi,
    },
    formula:
      "clicks = floor(budget / CPC); conversions = clicks × CVR; BNHub revenue ≈ conversions × 0.35 × avg_booking × take_rate (proxy — validate vs Stripe).",
  };
}

/** Run simulation on output of `allocateLaunchBudget`. */
export function simulateFromAllocatedBudget(
  allocation: BudgetEngineResult,
  opts?: { avgBookingValueCad?: number; bnhubTakeRate?: number }
): PerformanceSimulationResult {
  return simulateCampaignPerformance({
    campaigns: allocation.campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      budgetCad: c.budgetCad,
      expectedCpcCad: c.expectedCpcCad,
      expectedConversionRate: c.expectedConversionRate,
      target: c.target,
    })),
    avgBookingValueCad: opts?.avgBookingValueCad,
    bnhubTakeRate: opts?.bnhubTakeRate,
  });
}
