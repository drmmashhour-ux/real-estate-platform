/**
 * AVM input/output types.
 */

import type { ValuationType, ConfidenceLabel, RiskLevel, PricePositionLabel } from "./constants";

export interface PropertyInput {
  propertyIdentityId: string;
  listingId?: string | null;
  cadastreNumber?: string | null;
  address: string;
  city: string;
  municipality?: string | null;
  province?: string | null;
  propertyType?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  buildingAreaSqft?: number | null;
  lotSizeSqft?: number | null;
  amenities?: string[];
  parking?: string | null;
  yearBuilt?: number | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface ComparableRecord {
  id: string;
  source: "listing" | "sale" | "rent";
  priceCents?: number;
  monthlyRentCents?: number;
  nightlyRateCents?: number;
  city: string;
  bedrooms?: number;
  bathrooms?: number;
  areaSqft?: number;
  distance?: number;
  weight: number;
  reason: string;
}

export interface ValuationExplanation {
  mainFactors: string[];
  positiveFactors: string[];
  negativeFactors: string[];
  positionNote?: string;
  positionLabel?: PricePositionLabel;
  dataConfidenceNote: string;
}

export interface SaleValuationResult {
  valuationType: "sale";
  estimatedValueCents: number;
  valueMinCents: number;
  valueMaxCents: number;
  confidenceScore: number;
  confidenceLabel: ConfidenceLabel;
  comparables: ComparableRecord[];
  explanation: ValuationExplanation;
  positionLabel: PricePositionLabel;
}

export interface LongTermRentValuationResult {
  valuationType: "long_term_rental";
  monthlyRentEstimateCents: number;
  rentMinCents: number;
  rentMaxCents: number;
  confidenceScore: number;
  confidenceLabel: ConfidenceLabel;
  comparables: ComparableRecord[];
  explanation: ValuationExplanation;
}

export interface ShortTermRentValuationResult {
  valuationType: "short_term_rental";
  recommendedNightlyRateCents: number;
  expectedMonthlyOccupancyPercent: number;
  expectedMonthlyRevenueCents: number;
  expectedAnnualRevenueCents: number;
  highSeasonNightlyCents?: number;
  lowSeasonNightlyCents?: number;
  confidenceScore: number;
  confidenceLabel: ConfidenceLabel;
  seasonalitySummary?: { month: string; occupancyPercent: number }[];
  explanation: ValuationExplanation;
}

export interface InvestmentValuationResult {
  valuationType: "investment";
  investmentScore: number; // 0-100
  riskLevel: RiskLevel;
  grossYieldEstimatePercent?: number;
  simpleRoiIndicator?: string;
  strengths: string[];
  weaknesses: string[];
  summaryInsight: string;
  confidenceScore: number;
  confidenceLabel: ConfidenceLabel;
  explanation: ValuationExplanation;
}

export type ValuationResult =
  | SaleValuationResult
  | LongTermRentValuationResult
  | ShortTermRentValuationResult
  | InvestmentValuationResult;
