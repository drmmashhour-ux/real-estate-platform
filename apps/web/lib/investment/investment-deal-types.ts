import type { RentalType } from "@/lib/investment/rental-model";
import { RENTAL_TYPE } from "@/lib/investment/rental-model";

/** Serializable investment deal — shared by compare, demo storage, and APIs. */
export type SerializableInvestmentDeal = {
  id: string;
  /** Legacy single-strategy marker; prefer preferredStrategy when both ROIs exist. */
  rentalType?: RentalType;
  propertyPrice: number;
  /** Long-term monthly rent (dual-strategy). Legacy ST-only may store est. revenue here. */
  monthlyRent: number;
  monthlyExpenses: number;
  nightlyRate?: number;
  occupancyRate?: number;
  roiLongTerm?: number;
  roiShortTerm?: number;
  preferredStrategy?: RentalType;
  roi: number;
  riskScore: number;
  rating: string;
  city: string;
  marketComparison: string;
  createdAt: string;
  source?: "analyze" | "demo";
};

export function normalizeDealRentalType(d: Pick<SerializableInvestmentDeal, "rentalType" | "preferredStrategy">): RentalType {
  if (d.preferredStrategy === RENTAL_TYPE.SHORT_TERM || d.preferredStrategy === RENTAL_TYPE.LONG_TERM) {
    return d.preferredStrategy;
  }
  return d.rentalType === RENTAL_TYPE.SHORT_TERM ? RENTAL_TYPE.SHORT_TERM : RENTAL_TYPE.LONG_TERM;
}
