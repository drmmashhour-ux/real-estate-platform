import type { DealAnalysisComparable, DealAnalysisScenario } from "@prisma/client";
import type {
  ComparableSummaryDto,
  ScenarioSummaryDto,
} from "@/modules/deal-analyzer/domain/contracts";

export function mapComparableRow(r: DealAnalysisComparable): ComparableSummaryDto {
  return {
    comparablePropertyId: r.comparablePropertyId,
    distanceKm: r.distanceKm,
    similarityScore: r.similarityScore,
    sourceType: r.sourceType,
    priceCents: r.priceCents,
    pricePerSqft: r.pricePerSqft,
    propertyType: r.propertyType,
    bedrooms: r.bedrooms,
    bathrooms: r.bathrooms,
    areaSqft: r.areaSqft,
    listingStatus: r.listingStatus,
  };
}

export function mapScenarioRow(r: DealAnalysisScenario): ScenarioSummaryDto {
  const details = r.details && typeof r.details === "object" ? (r.details as Record<string, unknown>) : {};
  const warnings = Array.isArray(details.warnings)
    ? details.warnings.filter((x): x is string => typeof x === "string")
    : [];
  const mortgageUnavailableReason =
    typeof details.mortgageUnavailableReason === "string" ? details.mortgageUnavailableReason : null;
  const confidenceLevel = typeof details.confidenceLevel === "string" ? details.confidenceLevel : null;

  const base = {
    scenarioType: r.scenarioType,
    scenarioMode: r.scenarioMode,
    monthlyRent: r.monthlyRent,
    occupancyRate: r.occupancyRate != null ? Number(r.occupancyRate) : null,
    operatingCost: r.operatingCost,
    mortgageCost: r.mortgageCost,
    monthlyCashFlow: r.monthlyCashFlow,
    annualRoiPercent: r.annualRoi != null ? Number(r.annualRoi) : null,
    capRatePercent: r.capRate != null ? Number(r.capRate) : null,
    warnings,
    mortgageUnavailableReason,
    confidenceLevel,
  };

  if (r.scenarioMode === "bnhub") {
    return {
      ...base,
      nightlyRateCents: typeof details.nightlyRateCents === "number" ? details.nightlyRateCents : null,
      monthlyGrossRevenueCents:
        typeof details.monthlyGrossRevenueCents === "number" ? details.monthlyGrossRevenueCents : null,
      monthlyNetOperatingCents:
        typeof details.monthlyNetOperatingCents === "number" ? details.monthlyNetOperatingCents : null,
    };
  }

  return base;
}
