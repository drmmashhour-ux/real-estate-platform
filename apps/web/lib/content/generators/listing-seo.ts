import type { CreateGeneratedContentDraftInput } from "../dao";
import { assertNoFabricatedClaims } from "../policies";
import type { GenerateContentInput, MarketContentConstraints } from "../types";
import { buildMarketConstraintAppendix, listingSeoSystemPreamble, templateListingSeoDraft } from "../templates";
import { resolveCreationMode } from "../creation-mode";

function entityListingId(entity: Record<string, unknown>): string | null {
  const id = entity.id ?? entity.listingId;
  return typeof id === "string" ? id : null;
}

/**
 * Template-first listing SEO package (title + meta + body notes). Persist via `createGeneratedContentDraft`.
 */
export function buildListingSeoDraft(
  input: GenerateContentInput,
  constraints: MarketContentConstraints,
): CreateGeneratedContentDraftInput {
  assertNoFabricatedClaims(input);
  const draft = templateListingSeoDraft(input);
  const preamble = listingSeoSystemPreamble(input.locale);
  const appendix = buildMarketConstraintAppendix(input.locale, constraints);
  const body = [preamble, "", draft.description, "", appendix].join("\n");

  const creationMode = resolveCreationMode({
    targetLocale: input.locale,
    hasApprovedEnglishSource: Boolean(input.userFacingContext?.approvedEnglishSourceId),
    culturalAdaptation: constraints.marketCode === "syria",
  });

  return {
    surface: "listing_seo_meta",
    locale: input.locale,
    marketCode: constraints.marketCode,
    entityType: "listing",
    entityId: entityListingId(input.entity),
    title: draft.title,
    body,
    summary: draft.description.slice(0, 400),
    seoTitle: draft.title.slice(0, 70),
    seoDescription: draft.description.slice(0, 160),
    generationSource: "template",
    createdBySystem: true,
    creationMode,
    sourceContentId:
      typeof input.userFacingContext?.approvedEnglishSourceId === "string"
        ? input.userFacingContext.approvedEnglishSourceId
        : null,
    hostOverwritePolicy: "manual_review_required",
    metadata: { tone: input.tone, generator: "listing-seo" },
    statusOverride: "draft",
  };
}
