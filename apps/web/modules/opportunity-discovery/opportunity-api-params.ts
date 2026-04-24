import type { LecipmOpportunityKind, LecipmOpportunityRiskTier } from "@prisma/client";
import type { OpportunityListFilters } from "./opportunity-query.service";

const KINDS = new Set<LecipmOpportunityKind>([
  "UNDERVALUED",
  "VALUE_ADD",
  "HIGH_DEMAND",
  "ESG_UPSIDE",
  "INVESTOR_FIT",
  "ARBITRAGE",
]);

const RISKS = new Set<LecipmOpportunityRiskTier>(["LOW", "MEDIUM", "HIGH"]);

export function opportunityFiltersFromSearchParams(sp: URLSearchParams): OpportunityListFilters {
  const filters: OpportunityListFilters = {};

  const city = sp.get("city");
  if (city) filters.city = city;

  const propertyType = sp.get("propertyType");
  if (propertyType) filters.propertyType = propertyType;

  const marketSegment = sp.get("marketSegment");
  if (marketSegment) filters.marketSegment = marketSegment;

  const opportunityType = sp.get("opportunityType");
  if (opportunityType && KINDS.has(opportunityType as LecipmOpportunityKind)) {
    filters.opportunityType = opportunityType as LecipmOpportunityKind;
  }

  const minScore = sp.get("minScore");
  if (minScore != null && minScore !== "") filters.minScore = Number(minScore);

  const maxScore = sp.get("maxScore");
  if (maxScore != null && maxScore !== "") filters.maxScore = Number(maxScore);

  const riskLevel = sp.get("riskLevel");
  if (riskLevel && RISKS.has(riskLevel as LecipmOpportunityRiskTier)) {
    filters.riskLevel = riskLevel as LecipmOpportunityRiskTier;
  }

  if (sp.get("esgRelevant") === "1" || sp.get("esgRelevant") === "true") filters.esgRelevant = true;
  if (sp.get("investorReady") === "1" || sp.get("investorReady") === "true") filters.investorReady = true;

  const limit = sp.get("limit");
  if (limit != null && limit !== "") filters.limit = Number(limit);

  return filters;
}
