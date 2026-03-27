import type { InvestmentDeal } from "@prisma/client";
import { compareRentalStrategies, type DualStrategyComparison } from "@/lib/investment/rental-strategy-compare";
import { RENTAL_TYPE } from "@/lib/investment/rental-model";

/** Serializable public snapshot (no userId) for /deal/[id]. */
export type SharedDealPublicPayload =
  | {
      mode: "dual";
      id: string;
      city: string;
      propertyPrice: number;
      monthlyRent: number;
      monthlyExpenses: number;
      nightlyRate: number;
      occupancyRate: number;
      marketComparison: string;
      rating: string;
      preferredStrategy: string;
      dual: DualStrategyComparison;
    }
  | {
      mode: "dual_stored";
      id: string;
      city: string;
      propertyPrice: number;
      monthlyRent: number;
      monthlyExpenses: number;
      marketComparison: string;
      rating: string;
      preferredStrategy: string;
      roiLongTerm: number;
      roiShortTerm: number;
    }
  | {
      mode: "single";
      id: string;
      city: string;
      propertyPrice: number;
      monthlyRent: number;
      monthlyExpenses: number;
      marketComparison: string;
      rating: string;
      rentalType: string;
      roi: number;
    };

export function buildSharedDealPayload(deal: InvestmentDeal): SharedDealPublicPayload {
  const base = {
    id: deal.id,
    city: deal.city,
    propertyPrice: deal.propertyPrice,
    monthlyRent: deal.monthlyRent,
    monthlyExpenses: deal.monthlyExpenses,
    marketComparison: deal.marketComparison,
    rating: deal.rating,
  };

  if (deal.nightlyRate != null && deal.occupancyRate != null) {
    const dual = compareRentalStrategies(
      deal.propertyPrice,
      deal.monthlyRent,
      deal.monthlyExpenses,
      deal.nightlyRate,
      deal.occupancyRate
    );
    return {
      mode: "dual",
      ...base,
      nightlyRate: deal.nightlyRate,
      occupancyRate: deal.occupancyRate,
      preferredStrategy: deal.preferredStrategy ?? dual.preferredStrategy,
      dual,
    };
  }

  if (deal.roiLongTerm != null && deal.roiShortTerm != null) {
    return {
      mode: "dual_stored",
      ...base,
      preferredStrategy: deal.preferredStrategy ?? RENTAL_TYPE.LONG_TERM,
      roiLongTerm: deal.roiLongTerm,
      roiShortTerm: deal.roiShortTerm,
    };
  }

  return {
    mode: "single",
    ...base,
    rentalType: deal.rentalType,
    roi: deal.roi,
  };
}
