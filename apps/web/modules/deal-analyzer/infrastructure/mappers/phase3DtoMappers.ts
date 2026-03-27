import type {
  DealAffordabilityAnalysis,
  DealOfferStrategy,
  DealPortfolioAlert,
  DealWatchlist,
  SellerPricingAdvice,
} from "@prisma/client";
import type {
  AffordabilityPublicDto,
  OfferConditionDto,
  OfferStrategyPublicDto,
  PortfolioAlertPublicDto,
  SellerPricingAdvisorPublicDto,
  WatchlistPublicDto,
} from "@/modules/deal-analyzer/domain/contracts";

function jsonStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string");
}

const CONDITION_CATS = new Set<OfferConditionDto["category"]>(["financing", "inspection", "documents", "timeline"]);

function jsonConditions(raw: unknown): OfferConditionDto[] {
  if (!Array.isArray(raw)) return [];
  const out: OfferConditionDto[] = [];
  for (const x of raw) {
    if (!x || typeof x !== "object") continue;
    const o = x as Record<string, unknown>;
    const cat = o.category;
    if (
      typeof cat === "string" &&
      CONDITION_CATS.has(cat as OfferConditionDto["category"]) &&
      typeof o.label === "string" &&
      typeof o.note === "string"
    ) {
      out.push({
        category: cat as OfferConditionDto["category"],
        label: o.label,
        note: o.note,
      });
    }
  }
  return out;
}

export function mapOfferStrategyRow(row: DealOfferStrategy): OfferStrategyPublicDto {
  return {
    id: row.id,
    propertyId: row.propertyId,
    analysisId: row.analysisId,
    suggestedMinOfferCents: row.suggestedMinOfferCents,
    suggestedTargetOfferCents: row.suggestedTargetOfferCents,
    suggestedMaxOfferCents: row.suggestedMaxOfferCents,
    confidenceLevel: row.confidenceLevel,
    competitionSignal: row.competitionSignal,
    riskLevel: row.riskLevel,
    offerBand: row.offerBand,
    offerPosture: row.offerPosture,
    recommendedConditions: jsonConditions(row.recommendedConditions),
    warnings: jsonStringArray(row.warnings),
    explanation: row.explanation,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapAffordabilityRow(row: DealAffordabilityAnalysis): AffordabilityPublicDto {
  return {
    id: row.id,
    propertyId: row.propertyId,
    downPaymentCents: row.downPaymentCents,
    interestRate: row.interestRate != null ? Number(row.interestRate) : null,
    amortizationYears: row.amortizationYears,
    monthlyIncomeCents: row.monthlyIncomeCents,
    monthlyDebtsCents: row.monthlyDebtsCents,
    estimatedMonthlyPaymentCents: row.estimatedMonthlyPaymentCents,
    affordabilityLevel: row.affordabilityLevel,
    affordabilityRatio: row.affordabilityRatio != null ? Number(row.affordabilityRatio) : null,
    confidenceLevel: row.confidenceLevel,
    warnings: jsonStringArray(row.warnings),
    explanation: row.explanation,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapWatchlistRow(
  row: DealWatchlist & { _count?: { items: number } },
): WatchlistPublicDto {
  return {
    id: row.id,
    name: row.name,
    itemCount: row._count?.items ?? 0,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapPortfolioAlertRow(row: DealPortfolioAlert): PortfolioAlertPublicDto {
  return {
    id: row.id,
    watchlistId: row.watchlistId,
    propertyId: row.propertyId,
    alertType: row.alertType,
    severity: row.severity,
    title: row.title,
    message: row.message,
    status: row.status,
    metadata: row.metadata && typeof row.metadata === "object" ? (row.metadata as Record<string, unknown>) : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapSellerPricingRow(row: SellerPricingAdvice): SellerPricingAdvisorPublicDto {
  return {
    propertyId: row.propertyId,
    pricePosition: row.pricePosition,
    confidenceLevel: row.confidenceLevel,
    suggestedAction: row.suggestedAction,
    reasons: jsonStringArray(row.reasons),
    improvementActions: jsonStringArray(row.improvementActions),
    explanation: row.explanation,
    updatedAt: row.updatedAt.toISOString(),
  };
}
