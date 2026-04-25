/**
 * AI template recommendation – match listing type to Canva template.
 * Maps to template IDs from lib/canva/templates.ts
 */

import type { ListingInput } from "./brain";
import { canvaTemplates } from "@/lib/canva/templates";

export type TemplateRecommendation = {
  recommendedTemplateId: string;
  reason: string;
};

function str(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v.trim().toLowerCase();
  return String(v).toLowerCase();
}

export function recommendTemplate(listing: ListingInput | null): TemplateRecommendation {
  const title = str(listing?.title);
  const desc = str(listing?.description);
  const combined = `${title} ${desc}`;

  if (!listing || (!title && !desc)) {
    return {
      recommendedTemplateId: canvaTemplates[0]?.id ?? "real-estate-poster-1",
      reason: "Default poster template for real estate.",
    };
  }

  if (/luxury|luxurious|villa|penthouse|high-end|designer|stunning/i.test(combined)) {
    return {
      recommendedTemplateId: "real-estate-poster-1",
      reason: "Luxury listing — the poster template fits premium positioning.",
    };
  }
  if (/rental|rent|lease|monthly|tenant|short-term|vacation rental|holiday let/i.test(combined)) {
    return {
      recommendedTemplateId: "instagram-property-1",
      reason: "Rental property — social template works for quick rental visibility.",
    };
  }
  if (/family|home|house|yard|garden|kids|school|suburb/i.test(combined)) {
    return {
      recommendedTemplateId: "property-brochure-1",
      reason: "Family home — brochure template suits detailed, warm presentation.",
    };
  }
  if (/condo|apartment|modern|minimal|downtown|urban/i.test(combined)) {
    return {
      recommendedTemplateId: "instagram-property-1",
      reason: "Condo/urban — modern social template fits the style.",
    };
  }

  return {
    recommendedTemplateId: "real-estate-poster-1",
    reason: "General listing — poster template is a strong default.",
  };
}
