import type { CreateGeneratedContentDraftInput } from "../dao";
import type { GenerateContentInput, MarketContentConstraints } from "../types";
import { buildMarketConstraintAppendix, cityPageSystemPreamble } from "../templates";
import { translateServer } from "@/lib/i18n/server-translate";

/** Market banner + lightweight investor / launch snippet surfaces. */
export function buildMarketBannerDraft(
  input: GenerateContentInput,
  constraints: MarketContentConstraints,
): CreateGeneratedContentDraftInput {
  const title = constraints.contactFirst
    ? translateServer(input.locale, "contentEngine.template.bannerContactFirstTitle")
    : translateServer(input.locale, "contentEngine.template.bannerStandardTitle");
  const line = constraints.contactFirst
    ? translateServer(input.locale, "contentEngine.template.bannerContactFirstBody")
    : translateServer(input.locale, "contentEngine.template.bannerStandardBody");

  const body = [cityPageSystemPreamble(input.locale), "", line, "", buildMarketConstraintAppendix(input.locale, constraints)].join("\n\n");

  return {
    surface: "market_banner",
    locale: input.locale,
    marketCode: constraints.marketCode,
    entityType: "campaign",
    entityId: typeof input.entity.campaignId === "string" ? input.entity.campaignId : null,
    title,
    body,
    summary: line.slice(0, 200),
    seoTitle: title.slice(0, 60),
    seoDescription: line.slice(0, 155),
    generationSource: "template",
    createdBySystem: true,
    metadata: { generator: "marketing-copy", variant: "market_banner" },
    statusOverride: "pending_review",
  };
}

export function buildInvestorSnippetDraft(
  input: GenerateContentInput,
  constraints: MarketContentConstraints,
): CreateGeneratedContentDraftInput {
  const title = translateServer(input.locale, "contentEngine.template.investorSnippetTitle");
  const body = [
    translateServer(input.locale, "contentEngine.template.investorSnippetBody"),
    "",
    buildMarketConstraintAppendix(input.locale, constraints),
  ].join("\n\n");

  return {
    surface: "faq_answer",
    locale: input.locale,
    marketCode: constraints.marketCode,
    entityType: "system",
    entityId: null,
    title,
    body,
    summary: body.slice(0, 200),
    seoTitle: null,
    seoDescription: null,
    generationSource: "template",
    createdBySystem: true,
    metadata: { generator: "marketing-copy", variant: "investor_snippet" },
    statusOverride: "pending_review",
  };
}
