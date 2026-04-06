import { createGeneratedContentDraft } from "@/lib/content/dao";
import { buildListingSeoDraft } from "@/lib/content/generators/listing-seo";
import { toMarketContentConstraints } from "@/lib/content/market-context";
import type { GenerateContentInput, MarketContentConstraints } from "@/lib/content/types";
import type { ResolvedMarket } from "@/lib/markets/types";
import type { ContentOpportunity } from "./detect-content-opportunities";

/**
 * Turn a detected opportunity into a persisted draft (audit trail). No auto-publish.
 */
export async function persistDraftForOpportunity(input: {
  opportunity: ContentOpportunity;
  market: ResolvedMarket;
  listingEntity?: Record<string, unknown>;
  tone?: GenerateContentInput["tone"];
}): Promise<{ id: string } | { error: string }> {
  const constraints: MarketContentConstraints = toMarketContentConstraints(input.market);
  const locale = (input.market.suggestedDefaultLocale === "ar" ? "ar" : "en") as GenerateContentInput["locale"];

  if (input.opportunity.surfaceHint === "listing_seo_meta" && input.listingEntity) {
    const genIn: GenerateContentInput = {
      locale,
      marketCode: constraints.marketCode,
      surface: "listing_seo_meta",
      tone: input.tone ?? "conversion",
      entity: input.listingEntity,
    };
    const draft = buildListingSeoDraft(genIn, constraints);
    const row = await createGeneratedContentDraft(draft);
    return { id: row.id };
  }

  return { error: "unsupported_opportunity_surface" };
}
