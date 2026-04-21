import { generateListing, normalizeListingLanguage } from "@/modules/listing-assistant/listing-i18n.service";
import { checkListingCompliance } from "@/modules/listing-assistant/listing-compliance.checker";
import { suggestPricingRange } from "@/modules/listing-assistant/listing-pricing.suggester";
import { logAiGeneration, logComplianceCheck } from "@/modules/listing-assistant/listing-assistant.log";
import { buildSeoPack } from "@/modules/listing-assistant/listing-seo.engine";
import {
  computeListingPerformanceScore,
  deriveBuyerTargeting,
} from "@/modules/listing-assistant/listing-score.engine";
import { buildCentrisStructuredExport } from "@/modules/listing-assistant/listing-export.service";
import type {
  ComplianceCheckResult,
  FullListingAssistantBundle,
  ListingPropertyPartial,
  PricingSuggestionResult,
} from "@/modules/listing-assistant/listing-assistant.types";

/** Full multilingual bundle: content, compliance, SEO, targeting, scoring, structured export. */
export function generateListingAssistantDraft(
  property: ListingPropertyPartial,
  language?: string,
): FullListingAssistantBundle {
  const lang = normalizeListingLanguage(language);

  logAiGeneration("draft_template", {
    listingType: property.listingType ?? null,
    hasCity: Boolean(property.city),
    language: lang,
  });

  const content = generateListing(property, lang);

  const compliance = checkListingCompliance({
    title: content.title,
    description: content.description,
    highlights: content.propertyHighlights,
  });

  logComplianceCheck("generated_bundle", {
    riskLevel: compliance.riskLevel,
    warningCount: compliance.warnings.length,
  });

  const seo = buildSeoPack({
    title: content.title,
    description: content.description,
    city: property.city,
    listingType: property.listingType,
    language: lang,
  });

  const buyerTargeting = deriveBuyerTargeting(property, content);
  const listingPerformance = computeListingPerformanceScore(content, compliance);
  const centrisStructured = buildCentrisStructuredExport(content);

  return {
    content,
    compliance,
    seo,
    buyerTargeting,
    listingPerformance,
    centrisStructured,
    language: lang,
  };
}

/** Compliance-only pass for broker-edited text before publish. */
export function complianceCheckDraft(fields: {
  title?: string;
  description?: string;
  highlights?: string[];
}): ComplianceCheckResult {
  const result = checkListingCompliance(fields);
  logComplianceCheck("manual_text", {
    riskLevel: result.riskLevel,
    compliant: result.compliant,
  });
  return result;
}

/** Pricing band vs CRM peers of same listing type. */
export async function pricingSuggestionForListing(params: {
  listingType: string;
  currentPriceMajor?: number | null;
}): Promise<PricingSuggestionResult> {
  const out = await suggestPricingRange(params);
  logAiGeneration("pricing_band", {
    competitivenessScore: out.competitivenessScore,
    listingType: params.listingType,
  });
  return out;
}
