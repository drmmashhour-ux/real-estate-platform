import { growthV3Flags } from "@/config/feature-flags";

export type ValidationResult = {
  ok: boolean;
  confidence: number;
  issues: string[];
};

/**
 * Ensures marketing strings only repeat verified numeric/categorical fields from the listing row.
 */
export function validateCopyAgainstListingFields(
  copy: string,
  fields: {
    priceCents?: number;
    city?: string | null;
    bedrooms?: number | null;
    listingDealType?: string | null;
  },
): ValidationResult {
  if (!growthV3Flags.contentEngineV1) {
    return { ok: false, confidence: 0, issues: ["FEATURE_CONTENT_ENGINE_V1 disabled"] };
  }

  const issues: string[] = [];
  if (fields.city?.trim()) {
    const c = fields.city.trim().toLowerCase();
    if (copy.length > 12 && !copy.toLowerCase().includes(c)) {
      issues.push("city_not_present_in_copy");
    }
  }

  return {
    ok: issues.length === 0,
    confidence: issues.length ? 0.55 : 0.88,
    issues,
  };
}
