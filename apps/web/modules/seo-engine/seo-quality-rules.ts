import type { SeoQualityRules } from "./seo-engine.types";

/** Terms to avoid in generated SEO/editorial copy (automated guardrails). */
export const SEO_FORBIDDEN_TERMS = [
  "medical status",
  "diagnosis",
  "patient",
  "treatment",
  "medication",
  "clinical note",
  "health condition",
  "guaranteed return",
  "guaranteed yield",
] as const;

export const DEFAULT_SEO_QUALITY_RULES: SeoQualityRules = {
  brandTone:
    "Premium, accurate, location-led. No keyword stuffing. No fake inventory counts or investment promises.",
  disallowInventoryClaimsWithoutData: true,
  disallowInvestmentPromises: true,
  disallowMedicalOrCareClaimsForResidenceServices: true,
};

/**
 * Returns first forbidden term found, or null if clean (case-insensitive).
 */
export function findForbiddenTerm(text: string): string | null {
  const lower = text.toLowerCase();
  for (const term of SEO_FORBIDDEN_TERMS) {
    if (lower.includes(term.toLowerCase())) return term;
  }
  return null;
}
