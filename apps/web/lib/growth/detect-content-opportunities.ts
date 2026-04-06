import type { ContentLocale } from "@/lib/content/types";
import { translateServer } from "@/lib/i18n/server-translate";

export type ContentOpportunity = {
  id: string;
  severity: "low" | "medium" | "high";
  /** i18n key for admin/host UI */
  messageKey: string;
  surfaceHint: string;
  entityId?: string | null;
};

export type ListingQualityInput = {
  id: string;
  title?: string | null;
  description?: string | null;
  seoTitle?: string | null;
  localesPresent?: ContentLocale[];
};

export type GrowthScanContext = {
  locale: ContentLocale;
  marketCode: string;
  syriaContactFirst?: boolean;
};

export function detectListingOpportunities(
  listings: ListingQualityInput[],
  ctx: GrowthScanContext,
): ContentOpportunity[] {
  const out: ContentOpportunity[] = [];
  for (const l of listings) {
    if (!l.description || l.description.trim().length < 40) {
      out.push({
        id: `listing-${l.id}-description`,
        severity: "high",
        messageKey: "contentEngine.template.growthListingNoDescription",
        surfaceHint: "listing_description",
        entityId: l.id,
      });
    }
    if (!l.seoTitle || l.seoTitle.length < 10) {
      out.push({
        id: `listing-${l.id}-seo`,
        severity: "medium",
        messageKey: "contentEngine.template.growthWeakSeoTitle",
        surfaceHint: "listing_seo_meta",
        entityId: l.id,
      });
    }
    const present = new Set(l.localesPresent ?? ["en"]);
    for (const need of ["fr", "ar"] as ContentLocale[]) {
      if (!present.has(need)) {
        out.push({
          id: `listing-${l.id}-locale-${need}`,
          severity: "medium",
          messageKey: "contentEngine.template.growthMissingLocaleCopy",
          surfaceHint: "listing_description",
          entityId: l.id,
        });
      }
    }
  }
  if (ctx.syriaContactFirst) {
    out.push({
      id: `market-${ctx.marketCode}-syria-banner`,
      severity: "low",
      messageKey: "contentEngine.template.growthSyriaBanner",
      surfaceHint: "market_banner",
    });
  }
  return out;
}

export function formatOpportunityMessage(locale: ContentLocale, opp: ContentOpportunity): string {
  return translateServer(locale, opp.messageKey);
}
