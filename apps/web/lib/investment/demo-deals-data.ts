import {
  compareDealToMarket,
  computeDealMetrics,
  computeInvestmentInsights,
  isMarketCity,
} from "@/lib/investment/deal-metrics";
import type { SerializableInvestmentDeal } from "@/lib/investment/investment-deal-types";
import { compareRentalStrategies } from "@/lib/investment/rental-strategy-compare";
import { RENTAL_TYPE } from "@/lib/investment/rental-model";

const SAMPLE_INPUTS: Array<{
  city: string;
  propertyPrice: number;
  monthlyRent: number;
  monthlyExpenses: number;
  nightlyRate: number;
  occupancyRate: number;
}> = [
  {
    city: "Montreal",
    propertyPrice: 485_000,
    monthlyRent: 3_200,
    monthlyExpenses: 2_100,
    nightlyRate: 165,
    occupancyRate: 58,
  },
  {
    city: "Laval",
    propertyPrice: 365_000,
    monthlyRent: 2_450,
    monthlyExpenses: 1_580,
    nightlyRate: 120,
    occupancyRate: 62,
  },
  {
    city: "Toronto",
    propertyPrice: 825_000,
    monthlyRent: 4_100,
    monthlyExpenses: 3_200,
    nightlyRate: 195,
    occupancyRate: 55,
  },
];

/** Build 2–3 realistic sample deals for demo mode (deterministic IDs). */
export function buildSampleDemoDeals(): SerializableInvestmentDeal[] {
  return SAMPLE_INPUTS.map((s, i) => {
    const city = isMarketCity(s.city) ? s.city : "Montreal";
    const dual = compareRentalStrategies(s.propertyPrice, s.monthlyRent, s.monthlyExpenses, s.nightlyRate, s.occupancyRate);
    const preferred = dual.preferredStrategy;
    const preferredIncome =
      preferred === RENTAL_TYPE.SHORT_TERM ? dual.monthlyRevenueShortTerm : dual.monthlyRentLongTerm;
    const roi = preferred === RENTAL_TYPE.SHORT_TERM ? dual.roiShortTerm : dual.roiLongTerm;
    const { monthlyCashFlow } = computeDealMetrics(s.propertyPrice, preferredIncome, s.monthlyExpenses);
    const { riskScore, rating } = computeInvestmentInsights(roi, monthlyCashFlow);
    const { marketComparison } = compareDealToMarket(roi, city);
    const createdAt = new Date(Date.now() - (4 - i) * 86_400_000).toISOString();
    return {
      id: `demo-seed-${i + 1}`,
      rentalType: preferred,
      preferredStrategy: preferred,
      propertyPrice: s.propertyPrice,
      monthlyRent: s.monthlyRent,
      monthlyExpenses: s.monthlyExpenses,
      nightlyRate: s.nightlyRate,
      occupancyRate: s.occupancyRate,
      roiLongTerm: dual.roiLongTerm,
      roiShortTerm: dual.roiShortTerm,
      roi,
      riskScore,
      rating,
      city,
      marketComparison,
      createdAt,
    };
  });
}
