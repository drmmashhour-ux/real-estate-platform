/**
 * Growth content orchestration — wraps deterministic marketing generator (no edits to marketing-generator.service.ts).
 */
import {
  generateMarketingCopy,
  generateMarketingCreatives,
  type MarketingGeneratorInput,
} from "@/modules/marketing/marketing-generator.service";

export type GrowthContentInput = {
  audience: MarketingGeneratorInput["target"];
  city: string;
  listingId?: string | null;
  campaignGoal: "awareness" | "conversion" | "retention";
  tone: MarketingGeneratorInput["tone"];
  offerType?: string | null;
};

export function generateGrowthContentDrafts(input: GrowthContentInput) {
  const objective: MarketingGeneratorInput["objective"] =
    input.campaignGoal === "conversion" ? "sign_up" : input.campaignGoal === "retention" ? "book_call" : "browse_listings";

  const base: MarketingGeneratorInput = {
    target: input.audience,
    city: input.city.trim() || "Montréal",
    tone: input.tone,
    objective,
  };
  const copy = generateMarketingCopy(base);
  const creative = generateMarketingCreatives(base);

  return {
    googleAdsStyle: {
      headlines: copy.headlines.slice(0, 6),
      descriptions: copy.descriptions.slice(0, 4),
    },
    socialCaptions: copy.socialCaptions.slice(0, 4),
    poster: {
      headline: creative.posterHeadline,
      subhead: creative.posterSubhead,
      cta: creative.posterCta,
    },
    hashtags: copy.hashtags,
    listingContextNote: input.listingId ? `Listing context id: ${input.listingId} (verify before publishing).` : null,
    offerType: input.offerType ?? null,
  };
}
