import { computeShortTermMonthlyRevenue, RENTAL_TYPE, type RentalType } from "@/lib/investment/rental-model";

/** Side-by-side long-term vs short-term (Airbnb-style) metrics for the same property. */
export type DualStrategyComparison = {
  monthlyRentLongTerm: number;
  monthlyRevenueShortTerm: number;
  monthlyCashFlowLT: number;
  monthlyCashFlowST: number;
  annualCashFlowLT: number;
  annualCashFlowST: number;
  roiLongTerm: number;
  roiShortTerm: number;
  /** Higher ROI wins; ties favor long-term (stability). */
  preferredStrategy: RentalType;
  shortTermWinsOnRoi: boolean;
};

/**
 * Long-term: annualCashFlow_LT = (monthlyRent - monthlyExpenses) * 12
 * Short-term: monthlyRevenue_ST = nightly × (occupancy%/100) × 30; annual CF and ROI from that income.
 */
export function compareRentalStrategies(
  propertyPrice: number,
  monthlyRentLongTerm: number,
  monthlyExpenses: number,
  nightlyRate: number,
  occupancyPercent: number
): DualStrategyComparison {
  const monthlyRevenueST = computeShortTermMonthlyRevenue(nightlyRate, occupancyPercent);
  const monthlyCashFlowLT = monthlyRentLongTerm - monthlyExpenses;
  const monthlyCashFlowST = monthlyRevenueST - monthlyExpenses;
  const annualCashFlowLT = monthlyCashFlowLT * 12;
  const annualCashFlowST = monthlyCashFlowST * 12;
  const roiLongTerm = propertyPrice > 0 ? (annualCashFlowLT / propertyPrice) * 100 : 0;
  const roiShortTerm = propertyPrice > 0 ? (annualCashFlowST / propertyPrice) * 100 : 0;
  const shortTermWinsOnRoi = roiShortTerm > roiLongTerm;
  const preferredStrategy = shortTermWinsOnRoi ? RENTAL_TYPE.SHORT_TERM : RENTAL_TYPE.LONG_TERM;

  return {
    monthlyRentLongTerm,
    monthlyRevenueShortTerm: monthlyRevenueST,
    monthlyCashFlowLT,
    monthlyCashFlowST,
    annualCashFlowLT,
    annualCashFlowST,
    roiLongTerm,
    roiShortTerm,
    preferredStrategy,
    shortTermWinsOnRoi,
  };
}

/** Portfolio / compare: monthly cash flow under the saved preferred strategy (or legacy single-strategy). */
export function effectiveMonthlyCashFlowForDeal(d: {
  monthlyRent: number;
  monthlyExpenses: number;
  nightlyRate?: number | null;
  occupancyRate?: number | null;
  preferredStrategy?: string | null;
  rentalType?: string | null;
  roiLongTerm?: number | null;
  roiShortTerm?: number | null;
}): number {
  const nightlyRate = d.nightlyRate ?? null;
  const occupancyRate = d.occupancyRate ?? null;
  const lt = d.monthlyRent - d.monthlyExpenses;
  const pref = d.preferredStrategy ?? d.rentalType ?? RENTAL_TYPE.LONG_TERM;
  const hasDual =
    d.roiLongTerm != null &&
    d.roiShortTerm != null &&
    nightlyRate != null &&
    occupancyRate != null &&
    (pref === RENTAL_TYPE.SHORT_TERM || pref === RENTAL_TYPE.LONG_TERM);

  if (hasDual) {
    const stRev = computeShortTermMonthlyRevenue(nightlyRate, occupancyRate);
    const st = stRev - d.monthlyExpenses;
    const v = pref === RENTAL_TYPE.SHORT_TERM ? st : lt;
    return Number.isFinite(v) ? v : 0;
  }

  // Legacy: short-term-only save stored est. revenue in monthlyRent
  if (d.rentalType === RENTAL_TYPE.SHORT_TERM && (d.roiLongTerm == null || d.roiShortTerm == null)) {
    return Number.isFinite(lt) ? lt : 0;
  }

  return Number.isFinite(lt) ? lt : 0;
}
