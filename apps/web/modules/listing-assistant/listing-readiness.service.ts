import type {
  ComplianceCheckResult,
  GeneratedListingContent,
  ListingPropertyPartial,
  ListingReadinessResult,
  ListingReadinessStatus,
  PricingSuggestionResult,
} from "@/modules/listing-assistant/listing-assistant.types";

/** Narrow slice used by readiness scoring (avoid fabricating entire generated bundles). */
export type ListingReadinessContentInput = Pick<
  GeneratedListingContent,
  "title" | "description" | "propertyHighlights" | "language"
>;

function completenessScore(content: ListingReadinessContentInput, partial: ListingPropertyPartial): number {
  let pts = 0;
  let max = 6;
  if (content.title.trim().length >= 12) pts += 1;
  if (content.description.trim().length >= 120) pts += 1;
  if (content.propertyHighlights.length >= 3) pts += 1;
  if (partial.city?.trim()) pts += 1;
  if (partial.listingType) pts += 1;
  if (partial.priceMajor != null && partial.priceMajor > 0) pts += 1;
  else max -= 1;
  return Math.round((pts / max) * 100);
}

function complianceFactor(c: ComplianceCheckResult): number {
  if (c.riskLevel === "HIGH") return 0;
  if (c.riskLevel === "MEDIUM") return 0.65;
  return 1;
}

function pricingFactor(p: PricingSuggestionResult | null): number {
  if (!p) return 0.85;
  if (p.thinDataWarning || p.confidenceLevel === "LOW") return 0.55;
  if (p.confidenceLevel === "MEDIUM") return 0.8;
  return 1;
}

/**
 * Composite readiness gate — advisory; broker retains publish authority.
 */
export function computeListingReadiness(params: {
  content: ListingReadinessContentInput | GeneratedListingContent;
  compliance: ComplianceCheckResult;
  partial?: ListingPropertyPartial;
  pricing?: PricingSuggestionResult | null;
}): ListingReadinessResult {
  const complete = completenessScore(params.content, params.partial ?? {});
  const compF = complianceFactor(params.compliance);
  const priceF = pricingFactor(params.pricing ?? null);

  const readinessScore = Math.round(clamp01(complete / 100) * 100 * compF * priceF);

  const blockers: string[] = [];
  const fixes: string[] = [];

  if (params.compliance.riskLevel === "HIGH") blockers.push("Compliance: high textual risk — rewrite guarantees / superlatives.");
  else if (!params.compliance.compliant) blockers.push("Compliance warnings present — broker review recommended.");

  if (complete < 70) blockers.push("Draft completeness below target — add city, pricing context, or depth.");
  if (params.pricing?.thinDataWarning) blockers.push("Pricing band based on thin CRM peer sample — verify comps manually.");

  if (params.content.propertyHighlights.length < 3) {
    fixes.push("Add three or more factual highlights.");
  }
  if (params.content.description.length < 160) {
    fixes.push("Extend description with materials, zoning context, or diligence disclaimers.");
  }
  if (params.pricing && params.pricing.confidenceLevel !== "HIGH") {
    fixes.push("Cross-check illustrative price band with MLS / internal comps.");
  }

  let readinessStatus: ListingReadinessStatus = "READY";
  if (params.compliance.riskLevel === "HIGH" || readinessScore < 45) readinessStatus = "HIGH_RISK";
  else if (
    readinessScore < 72 ||
    params.compliance.riskLevel === "MEDIUM" ||
    params.pricing?.thinDataWarning
  )
    readinessStatus = "NEEDS_EDITS";

  const topBlockers = blockers.slice(0, 6);
  const recommendedFixes = fixes.slice(0, 8);

  return {
    readinessStatus,
    readinessScore,
    topBlockers,
    recommendedFixes,
  };
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}
