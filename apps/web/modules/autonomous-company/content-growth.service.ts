/**
 * Content & SEO — draft-only unless explicit publish flag (future; default never auto-publish).
 */
import { autonomousCompanyFlags } from "@/config/feature-flags";
import type { ContentGrowthDraftBundle, StrategyEngineOutput } from "./autonomous-company.types";

export function buildContentGrowthDrafts(strategy: StrategyEngineOutput | null): ContentGrowthDraftBundle {
  if (!autonomousCompanyFlags.autonomousContentV1) {
    return {
      listingDescriptions: [],
      adCopyVariants: [],
      seoPageOutlines: [],
      socialHooks: [],
      publishAllowed: false,
      notes: ["FEATURE_AUTONOMOUS_CONTENT_V1 is off — no drafts generated."],
    };
  }

  const headline = strategy?.priorities[0]?.label ?? "Platform growth";
  return {
    listingDescriptions: [],
    adCopyVariants: [
      {
        id: "draft_ads_1",
        draft: `[DRAFT] Highlight trust + availability — ${headline.slice(0, 80)}`,
      },
    ],
    seoPageOutlines: [
      {
        id: "seo_outline_1",
        outline: `[DRAFT] H1: ${headline} · sections: proof, listings, CTA (manual review required).`,
      },
    ],
    socialHooks: [`[DRAFT] ${headline}`],
    publishAllowed: false,
    notes: ["Draft-only — no auto-publish; legal/compliance review required before any live content."],
  };
}
