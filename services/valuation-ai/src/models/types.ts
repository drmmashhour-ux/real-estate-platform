/**
 * AVM input/output types (mirrors apps/web lib/valuation/types for standalone service).
 */

export type ConfidenceLabel = "low" | "medium" | "high";
export type ValuationType = "sale" | "long_term_rental" | "short_term_rental" | "investment";

export interface PropertyInput {
  propertyIdentityId: string;
  listingId?: string | null;
  address: string;
  city: string;
  municipality?: string | null;
  province?: string | null;
  propertyType?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  buildingAreaSqft?: number | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface ValuationSummary {
  valuationType: ValuationType;
  confidenceScore: number;
  confidenceLabel: ConfidenceLabel;
  valuationSummary: string;
  disclaimer: string;
}
